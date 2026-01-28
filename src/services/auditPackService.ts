/**
 * Audit Pack Service
 * Handles audit pack creation, retrieval, and management
 */

import { supabase } from '@/integrations/supabase/client';
import { auditService } from '@/services/auditService';
import type { AuditPack, AuditPackType, CreateAuditPackInput, AuditPackPreview } from '@/types/auditPacks';

class AuditPackService {
  /**
   * Get all audit packs for the organisation
   */
  async getAuditPacks(organisationId: string): Promise<AuditPack[]> {
    const { data, error } = await supabase
      .from('audit_packs')
      .select('*')
      .eq('organisation_id', organisationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[AuditPackService] Failed to fetch audit packs:', error);
      throw error;
    }

    return (data || []).map(this.mapAuditPack);
  }

  /**
   * Get a single audit pack by ID
   */
  async getAuditPack(id: string): Promise<AuditPack | null> {
    const { data, error } = await supabase
      .from('audit_packs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[AuditPackService] Failed to fetch audit pack:', error);
      throw error;
    }

    return data ? this.mapAuditPack(data) : null;
  }

  /**
   * Generate a preview of what the audit pack will contain
   */
  async getPreview(
    packType: AuditPackType,
    organisationId: string,
    employeeId?: string | null,
    dateRangeStart?: string | null,
    dateRangeEnd?: string | null
  ): Promise<AuditPackPreview> {
    const estimatedRecords: AuditPackPreview['estimatedRecords'] = {};

    // Build date filter
    const startDate = dateRangeStart || '1900-01-01';
    const endDate = dateRangeEnd || '2100-12-31';

    switch (packType) {
      case 'employee_compliance':
        if (employeeId) {
          // Count certifications for employee
          const { count: certCount } = await supabase
            .from('employee_certifications')
            .select('*', { count: 'exact', head: true })
            .eq('employee_id', employeeId);
          estimatedRecords.certifications = certCount || 0;

          // Count overrides
          const { count: overrideCount } = await supabase
            .from('compliance_overrides')
            .select('*', { count: 'exact', head: true })
            .eq('employee_id', employeeId);
          estimatedRecords.overrides = overrideCount || 0;

          // Count audit logs
          const { count: auditCount } = await supabase
            .from('audit_logs')
            .select('*', { count: 'exact', head: true })
            .eq('entity_id', employeeId);
          estimatedRecords.auditLogs = auditCount || 0;
        }
        break;

      case 'organisation_compliance':
        // Count employees
        const { count: empCount } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true })
          .eq('organisation_id', organisationId);
        estimatedRecords.employees = empCount || 0;

        // Count all certifications
        const { count: allCertCount } = await supabase
          .from('employee_certifications')
          .select('*', { count: 'exact', head: true })
          .eq('organisation_id', organisationId);
        estimatedRecords.certifications = allCertCount || 0;

        // Count all overrides in date range
        const { count: allOverrideCount } = await supabase
          .from('compliance_overrides')
          .select('*', { count: 'exact', head: true })
          .eq('organisation_id', organisationId)
          .gte('created_at', startDate)
          .lte('created_at', endDate);
        estimatedRecords.overrides = allOverrideCount || 0;
        break;

      case 'hr_incidents':
        // Count HR cases
        let casesQuery = supabase
          .from('hr_cases')
          .select('*', { count: 'exact', head: true })
          .eq('organisation_id', organisationId)
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        if (employeeId) {
          casesQuery = casesQuery.eq('employee_id', employeeId);
        }

        const { count: caseCount } = await casesQuery;
        estimatedRecords.cases = caseCount || 0;
        break;

      case 'payroll_verification':
        // Count timesheets
        let timesheetsQuery = supabase
          .from('timesheets')
          .select('*', { count: 'exact', head: true })
          .eq('organisation_id', organisationId)
          .gte('date', startDate)
          .lte('date', endDate);

        if (employeeId) {
          timesheetsQuery = timesheetsQuery.eq('employee_id', employeeId);
        }

        const { count: timesheetCount } = await timesheetsQuery;
        estimatedRecords.timesheets = timesheetCount || 0;
        break;
    }

    return {
      pack_type: packType,
      scope: employeeId ? 'Single Employee' : 'Organisation-wide',
      dateRange: dateRangeStart && dateRangeEnd 
        ? `${dateRangeStart} to ${dateRangeEnd}` 
        : 'All time',
      estimatedRecords,
    };
  }

  /**
   * Create a new audit pack request
   */
  async createAuditPack(
    organisationId: string,
    input: CreateAuditPackInput
  ): Promise<AuditPack> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .maybeSingle();

    const insertData = {
      organisation_id: organisationId,
      pack_type: input.pack_type,
      employee_id: input.employee_id || null,
      date_range_start: input.date_range_start || null,
      date_range_end: input.date_range_end || null,
      include_restricted_content: input.include_restricted_content || false,
      include_attachments: input.include_attachments || false,
      generated_by: user.id,
      generated_by_name: profile?.display_name || user.email,
      generated_by_email: user.email,
      status: 'pending' as const,
    };

    const { data, error } = await supabase
      .from('audit_packs')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[AuditPackService] Failed to create audit pack:', error);
      throw error;
    }

    // Log the export action
    await auditService.log({
      action: 'document.upload',
      entityType: 'document',
      entityId: data.id,
      organisationId,
      afterState: {
        pack_type: input.pack_type,
        employee_id: input.employee_id,
        date_range: `${input.date_range_start} - ${input.date_range_end}`,
        include_restricted: input.include_restricted_content,
        action: 'audit_pack_requested',
      },
    });

    return this.mapAuditPack(data);
  }

  /**
   * Trigger pack generation via edge function
   */
  async generatePack(packId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('generate-audit-pack', {
      body: { packId },
    });

    if (error) {
      console.error('[AuditPackService] Failed to trigger pack generation:', error);
      throw error;
    }
  }

  /**
   * Get download URL for a pack file
   */
  async getDownloadUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase
      .storage
      .from('audit-packs')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      console.error('[AuditPackService] Failed to get download URL:', error);
      throw error;
    }

    return data.signedUrl;
  }

  private mapAuditPack(data: Record<string, unknown>): AuditPack {
    return {
      id: data.id as string,
      organisation_id: data.organisation_id as string,
      pack_type: data.pack_type as AuditPackType,
      status: data.status as AuditPack['status'],
      employee_id: data.employee_id as string | null,
      date_range_start: data.date_range_start as string | null,
      date_range_end: data.date_range_end as string | null,
      include_restricted_content: data.include_restricted_content as boolean,
      include_attachments: data.include_attachments as boolean,
      generated_by: data.generated_by as string,
      generated_by_name: data.generated_by_name as string | null,
      generated_by_email: data.generated_by_email as string | null,
      file_urls: (data.file_urls as string[]) || [],
      summary: (data.summary as AuditPack['summary']) || {},
      error_message: data.error_message as string | null,
      retention_days: data.retention_days as number,
      expires_at: data.expires_at as string | null,
      started_at: data.started_at as string | null,
      completed_at: data.completed_at as string | null,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string,
    };
  }
}

export const auditPackService = new AuditPackService();
