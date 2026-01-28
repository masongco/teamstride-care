import { supabase } from '@/integrations/supabase/client';
import { auditService } from './auditService';
import type {
  HRCase,
  HRCaseTriage,
  HRCaseEvidence,
  HRCaseNote,
  HRCaseFindings,
  HRCaseAction,
  CreateHRCaseInput,
  UpdateHRCaseInput,
  CreateTriageInput,
  CreateNoteInput,
  CreateFindingsInput,
  CreateActionInput,
  UpdateActionInput,
  HRCaseStats,
  HRCaseStatus,
  HRCaseType,
  HRCaseSeverity,
} from '@/types/hrCases';

/**
 * HR Cases Service
 * Handles all CRUD operations for HR incidents, misconduct, and disciplinary cases.
 * All operations are audit-logged for legal defensibility.
 */
class HRCasesService {
  private async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .maybeSingle();
    
    return {
      id: user.id,
      email: user.email,
      name: profile?.display_name || user.email,
    };
  }

  // ============ CASES ============

  async getCases(filters?: {
    status?: HRCaseStatus;
    case_type?: HRCaseType;
    severity?: HRCaseSeverity;
    assigned_investigator_user_id?: string;
    safeguarding_only?: boolean;
  }): Promise<HRCase[]> {
    let query = supabase
      .from('hr_cases')
      .select(`
        *,
        employee:employees(id, first_name, last_name, email, position, department)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.case_type) {
      query = query.eq('case_type', filters.case_type);
    }
    if (filters?.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters?.assigned_investigator_user_id) {
      query = query.eq('assigned_investigator_user_id', filters.assigned_investigator_user_id);
    }
    if (filters?.safeguarding_only) {
      query = query.eq('safeguarding_flag', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[HRCasesService] Error fetching cases:', error);
      throw error;
    }

    return (data || []) as unknown as HRCase[];
  }

  async getCaseById(caseId: string): Promise<HRCase | null> {
    const { data, error } = await supabase
      .from('hr_cases')
      .select(`
        *,
        employee:employees(id, first_name, last_name, email, position, department)
      `)
      .eq('id', caseId)
      .maybeSingle();

    if (error) {
      console.error('[HRCasesService] Error fetching case:', error);
      throw error;
    }

    // Log case access for audit trail
    if (data) {
      await auditService.log({
        action: 'document.upload' as const, // Using existing action type for access logging
        entityType: 'setting', // Using setting as proxy for hr_case
        entityId: caseId,
        afterState: { action: 'case_accessed' },
      });
    }

    return data as unknown as HRCase | null;
  }

  async createCase(input: CreateHRCaseInput): Promise<HRCase> {
    const user = await this.getCurrentUser();
    
    const insertData = {
      organisation_id: input.organisation_id,
      employee_id: input.employee_id || null,
      case_number: 'TEMP', // Will be overwritten by database trigger
      case_type: input.case_type,
      reported_by: input.reported_by,
      reporter_name: input.reporter_name || null,
      reporter_contact: input.reporter_contact || null,
      date_reported: input.date_reported || new Date().toISOString().split('T')[0],
      summary: input.summary,
      detailed_description: input.detailed_description || null,
      severity: input.severity || 'medium',
      safeguarding_flag: input.safeguarding_flag || false,
      confidentiality_level: input.confidentiality_level || 'standard',
      assigned_investigator_user_id: input.assigned_investigator_user_id || null,
      created_by_user_id: user?.id || null,
    } as const;
    
    const { data, error } = await supabase
      .from('hr_cases')
      .insert(insertData)
      .select(`
        *,
        employee:employees(id, first_name, last_name, email, position, department)
      `)
      .single();

    if (error) {
      console.error('[HRCasesService] Error creating case:', error);
      throw error;
    }

    // Audit log
    await auditService.log({
      action: 'document.upload' as const,
      entityType: 'setting',
      entityId: data.id,
      organisationId: input.organisation_id,
      afterState: { 
        action: 'hr_case_created',
        case_number: data.case_number,
        case_type: input.case_type,
        severity: input.severity || 'medium',
      },
    });

    return data as unknown as HRCase;
  }

  async updateCase(caseId: string, input: UpdateHRCaseInput): Promise<HRCase> {
    // Get current state for audit
    const { data: before } = await supabase
      .from('hr_cases')
      .select('*')
      .eq('id', caseId)
      .single();

    // If closing, set closed_at
    const updateData: Record<string, unknown> = { ...input };
    if (input.status === 'closed' && before?.status !== 'closed') {
      updateData.closed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('hr_cases')
      .update(updateData)
      .eq('id', caseId)
      .select(`
        *,
        employee:employees(id, first_name, last_name, email, position, department)
      `)
      .single();

    if (error) {
      console.error('[HRCasesService] Error updating case:', error);
      throw error;
    }

    // Audit log
    await auditService.log({
      action: 'document.upload' as const,
      entityType: 'setting',
      entityId: caseId,
      beforeState: before ? { ...before, action: 'hr_case_updated' } : undefined,
      afterState: { ...data, action: 'hr_case_updated' },
    });

    return data as unknown as HRCase;
  }

  async closeCase(caseId: string, closureNotes?: string): Promise<HRCase> {
    // Validate closure requirements
    const { data: findings } = await supabase
      .from('hr_case_findings')
      .select('id')
      .eq('hr_case_id', caseId)
      .limit(1);

    if (!findings || findings.length === 0) {
      throw new Error('Cannot close case without findings. Please record findings first.');
    }

    return this.updateCase(caseId, {
      status: 'closed',
      closure_notes: closureNotes,
    });
  }

  // ============ TRIAGE ============

  async getTriage(caseId: string): Promise<HRCaseTriage | null> {
    const { data, error } = await supabase
      .from('hr_case_triage')
      .select('*')
      .eq('hr_case_id', caseId)
      .maybeSingle();

    if (error) {
      console.error('[HRCasesService] Error fetching triage:', error);
      throw error;
    }

    return data as HRCaseTriage | null;
  }

  async createTriage(input: CreateTriageInput): Promise<HRCaseTriage> {
    const user = await this.getCurrentUser();

    const { data, error } = await supabase
      .from('hr_case_triage')
      .insert({
        ...input,
        triaged_by_user_id: user?.id || '',
      })
      .select()
      .single();

    if (error) {
      console.error('[HRCasesService] Error creating triage:', error);
      throw error;
    }

    // Update case status to triaged
    await supabase
      .from('hr_cases')
      .update({ status: 'triaged' })
      .eq('id', input.hr_case_id);

    // Audit log
    await auditService.log({
      action: 'document.upload' as const,
      entityType: 'setting',
      entityId: data.id,
      afterState: { 
        action: 'hr_case_triaged',
        hr_case_id: input.hr_case_id,
        escalation_required: input.escalation_required,
      },
    });

    return data as HRCaseTriage;
  }

  // ============ NOTES ============

  async getNotes(caseId: string): Promise<HRCaseNote[]> {
    const { data, error } = await supabase
      .from('hr_case_notes')
      .select('*')
      .eq('hr_case_id', caseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[HRCasesService] Error fetching notes:', error);
      throw error;
    }

    return (data || []) as HRCaseNote[];
  }

  async createNote(input: CreateNoteInput): Promise<HRCaseNote> {
    const user = await this.getCurrentUser();

    const { data, error } = await supabase
      .from('hr_case_notes')
      .insert({
        ...input,
        created_by_user_id: user?.id || '',
        created_by_name: user?.name,
      })
      .select()
      .single();

    if (error) {
      console.error('[HRCasesService] Error creating note:', error);
      throw error;
    }

    // Audit log
    await auditService.log({
      action: 'document.upload' as const,
      entityType: 'setting',
      entityId: data.id,
      afterState: { 
        action: 'hr_case_note_added',
        hr_case_id: input.hr_case_id,
        visibility: input.visibility || 'standard',
      },
    });

    return data as HRCaseNote;
  }

  // ============ EVIDENCE ============

  async getEvidence(caseId: string): Promise<HRCaseEvidence[]> {
    const { data, error } = await supabase
      .from('hr_case_evidence')
      .select('*')
      .eq('hr_case_id', caseId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('[HRCasesService] Error fetching evidence:', error);
      throw error;
    }

    return (data || []) as HRCaseEvidence[];
  }

  async uploadEvidence(
    caseId: string,
    file: File,
    description?: string,
    accessLevel: 'normal' | 'restricted' = 'normal'
  ): Promise<HRCaseEvidence> {
    const user = await this.getCurrentUser();

    // Upload file to storage
    const fileName = `${caseId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('hr-case-evidence')
      .upload(fileName, file);

    if (uploadError) {
      console.error('[HRCasesService] Error uploading file:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('hr-case-evidence')
      .getPublicUrl(fileName);

    // Create evidence record
    const { data, error } = await supabase
      .from('hr_case_evidence')
      .insert({
        hr_case_id: caseId,
        file_url: urlData.publicUrl,
        file_name: file.name,
        description,
        uploaded_by_user_id: user?.id || '',
        uploaded_by_name: user?.name,
        access_level: accessLevel,
      })
      .select()
      .single();

    if (error) {
      console.error('[HRCasesService] Error creating evidence record:', error);
      throw error;
    }

    // Audit log
    await auditService.log({
      action: 'document.upload' as const,
      entityType: 'document',
      entityId: data.id,
      afterState: { 
        action: 'hr_case_evidence_uploaded',
        hr_case_id: caseId,
        file_name: file.name,
        access_level: accessLevel,
      },
    });

    return data as HRCaseEvidence;
  }

  // ============ FINDINGS ============

  async getFindings(caseId: string): Promise<HRCaseFindings | null> {
    const { data, error } = await supabase
      .from('hr_case_findings')
      .select('*')
      .eq('hr_case_id', caseId)
      .maybeSingle();

    if (error) {
      console.error('[HRCasesService] Error fetching findings:', error);
      throw error;
    }

    return data as HRCaseFindings | null;
  }

  async createFindings(input: CreateFindingsInput): Promise<HRCaseFindings> {
    const user = await this.getCurrentUser();

    const { data, error } = await supabase
      .from('hr_case_findings')
      .insert({
        ...input,
        decision_maker_user_id: user?.id || '',
        decision_maker_name: user?.name,
      })
      .select()
      .single();

    if (error) {
      console.error('[HRCasesService] Error creating findings:', error);
      throw error;
    }

    // Update case status to decision_made
    await supabase
      .from('hr_cases')
      .update({ status: 'decision_made' })
      .eq('id', input.hr_case_id);

    // Audit log
    await auditService.log({
      action: 'document.upload' as const,
      entityType: 'setting',
      entityId: data.id,
      afterState: { 
        action: 'hr_case_findings_recorded',
        hr_case_id: input.hr_case_id,
        substantiated: input.substantiated,
      },
    });

    return data as HRCaseFindings;
  }

  // ============ ACTIONS ============

  async getActions(caseId: string): Promise<HRCaseAction[]> {
    const { data, error } = await supabase
      .from('hr_case_actions')
      .select('*')
      .eq('hr_case_id', caseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[HRCasesService] Error fetching actions:', error);
      throw error;
    }

    return (data || []) as HRCaseAction[];
  }

  async createAction(input: CreateActionInput): Promise<HRCaseAction> {
    const user = await this.getCurrentUser();

    const { data, error } = await supabase
      .from('hr_case_actions')
      .insert({
        ...input,
        created_by_user_id: user?.id || '',
        created_by_name: user?.name,
      })
      .select()
      .single();

    if (error) {
      console.error('[HRCasesService] Error creating action:', error);
      throw error;
    }

    // Audit log
    await auditService.log({
      action: 'document.upload' as const,
      entityType: 'setting',
      entityId: data.id,
      afterState: { 
        action: 'hr_case_action_created',
        hr_case_id: input.hr_case_id,
        action_type: input.action_type,
        effective_date: input.effective_date,
        expiry_date: input.expiry_date,
      },
    });

    return data as HRCaseAction;
  }

  async updateAction(actionId: string, input: UpdateActionInput): Promise<HRCaseAction> {
    const { data: before } = await supabase
      .from('hr_case_actions')
      .select('*')
      .eq('id', actionId)
      .single();

    const { data, error } = await supabase
      .from('hr_case_actions')
      .update(input)
      .eq('id', actionId)
      .select()
      .single();

    if (error) {
      console.error('[HRCasesService] Error updating action:', error);
      throw error;
    }

    // Audit log
    await auditService.log({
      action: 'document.upload' as const,
      entityType: 'setting',
      entityId: actionId,
      beforeState: before ? { ...before, action: 'hr_case_action_updated' } : undefined,
      afterState: { ...data, action: 'hr_case_action_updated' },
    });

    return data as HRCaseAction;
  }

  // ============ STATISTICS ============

  async getStats(): Promise<HRCaseStats> {
    const { data: cases, error } = await supabase
      .from('hr_cases')
      .select('status, case_type, severity, safeguarding_flag');

    if (error) {
      console.error('[HRCasesService] Error fetching stats:', error);
      throw error;
    }

    const { data: activeWarnings } = await supabase
      .from('hr_case_actions')
      .select('id')
      .in('action_type', ['verbal_warning', 'written_warning', 'final_warning'])
      .eq('status', 'active')
      .gte('expiry_date', new Date().toISOString().split('T')[0]);

    const stats: HRCaseStats = {
      total: cases?.length || 0,
      byStatus: {
        new: 0,
        triaged: 0,
        investigating: 0,
        awaiting_response: 0,
        decision_made: 0,
        closed: 0,
      },
      byType: {
        incident: 0,
        misconduct: 0,
        grievance: 0,
        performance: 0,
        complaint: 0,
      },
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
      openCases: 0,
      closedCases: 0,
      safeguardingCases: 0,
      activeWarnings: activeWarnings?.length || 0,
    };

    cases?.forEach((c) => {
      stats.byStatus[c.status as HRCaseStatus]++;
      stats.byType[c.case_type as HRCaseType]++;
      stats.bySeverity[c.severity as HRCaseSeverity]++;
      if (c.status === 'closed') {
        stats.closedCases++;
      } else {
        stats.openCases++;
      }
      if (c.safeguarding_flag) {
        stats.safeguardingCases++;
      }
    });

    return stats;
  }

  // ============ AUDIT LOG ============

  async getCaseAuditLog(caseId: string) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_id', caseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[HRCasesService] Error fetching audit log:', error);
      throw error;
    }

    return data || [];
  }
}

export const hrCasesService = new HRCasesService();
