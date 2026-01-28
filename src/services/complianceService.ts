import { supabase } from '@/integrations/supabase/client';
import { auditService } from './auditService';

// Required certifications for NDIS compliance
export const REQUIRED_CERTIFICATIONS = [
  'police_check',
  'ndis_screening',
  'first_aid',
  'cpr',
  'wwcc',
] as const;

export type RequiredCertificationType = typeof REQUIRED_CERTIFICATIONS[number];

export interface CertificationStatus {
  type: string;
  status: 'missing' | 'expired' | 'expiring_soon' | 'valid' | 'rejected' | 'pending';
  expiryDate?: string;
  daysUntilExpiry?: number;
}

export interface ComplianceResult {
  employeeId: string;
  compliant: boolean;
  blockingReasons: CertificationStatus[];
  expiringSoon: CertificationStatus[];
  overrideActive: boolean;
  overrideDetails?: {
    id: string;
    reason: string;
    expiresAt: string;
    overrideBy: string;
  };
  evaluatedAt: string;
}

export interface EvaluationContext {
  contextType: 'shift' | 'client' | 'service' | 'general';
  contextId?: string;
  requiresDriving?: boolean;
  additionalRequirements?: string[];
}

export interface OverrideRequest {
  employeeId: string;
  reason: string;
  expiresAt: Date;
  contextType: 'shift' | 'client' | 'service' | 'general';
  contextId?: string;
  blockedCertifications: CertificationStatus[];
}

/**
 * Compliance Enforcement Service
 * Provides centralized compliance evaluation and override management
 */
class ComplianceService {
  /**
   * Evaluate employee compliance status
   * This calls the edge function for server-side validation
   */
  async evaluateCompliance(
    employeeId: string,
    context?: EvaluationContext
  ): Promise<ComplianceResult> {
    const { data, error } = await supabase.functions.invoke('evaluate-compliance', {
      body: { employeeId, context },
    });

    if (error) {
      console.error('[ComplianceService] Evaluation failed:', error);
      // Fail closed - return non-compliant if we can't evaluate
      return {
        employeeId,
        compliant: false,
        blockingReasons: [{
          type: 'system_error',
          status: 'missing',
        }],
        expiringSoon: [],
        overrideActive: false,
        evaluatedAt: new Date().toISOString(),
      };
    }

    if (data.failedClosed) {
      console.error('[ComplianceService] Evaluation failed closed:', data.error);
      return {
        employeeId,
        compliant: false,
        blockingReasons: [{
          type: 'system_error',
          status: 'missing',
        }],
        expiringSoon: [],
        overrideActive: false,
        evaluatedAt: new Date().toISOString(),
      };
    }

    return data as ComplianceResult;
  }

  /**
   * Check if assignment is allowed (considers overrides)
   */
  async canAssign(
    employeeId: string,
    context?: EvaluationContext
  ): Promise<{ allowed: boolean; result: ComplianceResult }> {
    const result = await this.evaluateCompliance(employeeId, context);
    
    // Allowed if compliant OR if there's an active override
    const allowed = result.compliant || result.overrideActive;
    
    return { allowed, result };
  }

  /**
   * Create a compliance override (Admin/Director only)
   */
  async createOverride(request: OverrideRequest): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Get user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .maybeSingle();

      // Verify user has admin or director role
      const { data: roleData } = await supabase.rpc('get_user_role', { _user_id: user.id });
      if (!roleData || !['admin', 'director'].includes(roleData)) {
        return { success: false, error: 'Only Admin or Director can create compliance overrides' };
      }

      // Validate expiry is within 14 days
      const maxExpiry = new Date();
      maxExpiry.setDate(maxExpiry.getDate() + 14);
      if (request.expiresAt > maxExpiry) {
        return { success: false, error: 'Override expiry cannot exceed 14 days' };
      }

      // Get employee's organisation
      const { data: employee } = await supabase
        .from('employees')
        .select('organisation_id')
        .eq('id', request.employeeId)
        .maybeSingle();

      if (!employee) {
        return { success: false, error: 'Employee not found' };
      }

      // Create the override using raw insert to bypass type issues with new table
      const { data: override, error: insertError } = await supabase
        .from('compliance_overrides')
        .insert([{
          organisation_id: employee.organisation_id,
          employee_id: request.employeeId,
          override_by: user.id,
          override_by_name: profile?.display_name || user.email || 'Unknown',
          override_by_email: user.email || '',
          reason: request.reason,
          blocked_certifications: JSON.stringify(request.blockedCertifications),
          context_type: request.contextType,
          context_id: request.contextId || null,
          expires_at: request.expiresAt.toISOString(),
        }] as any)
        .select()
        .single();

      if (insertError) {
        console.error('[ComplianceService] Override creation failed:', insertError);
        return { success: false, error: insertError.message };
      }

      // Audit log the override
      await auditService.log({
        action: 'admin.override',
        entityType: 'employee',
        entityId: request.employeeId,
        organisationId: employee.organisation_id,
        afterState: {
          override_id: override.id,
          reason: request.reason,
          expires_at: request.expiresAt.toISOString(),
          blocked_certifications: request.blockedCertifications,
          context_type: request.contextType,
        },
      });

      return { success: true };
    } catch (err) {
      console.error('[ComplianceService] Override creation error:', err);
      return { success: false, error: 'Failed to create override' };
    }
  }

  /**
   * Revoke an active override
   */
  async revokeOverride(overrideId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Verify user has admin role
      const { data: roleData } = await supabase.rpc('get_user_role', { _user_id: user.id });
      if (!roleData || !['admin', 'director'].includes(roleData)) {
        return { success: false, error: 'Only Admin or Director can revoke overrides' };
      }

      // Get the override before updating
      const { data: existingOverride } = await supabase
        .from('compliance_overrides')
        .select('*')
        .eq('id', overrideId)
        .maybeSingle();

      if (!existingOverride) {
        return { success: false, error: 'Override not found' };
      }

      const { error: updateError } = await supabase
        .from('compliance_overrides')
        .update({ is_active: false })
        .eq('id', overrideId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Audit log the revocation
      await auditService.log({
        action: 'admin.override',
        entityType: 'employee',
        entityId: existingOverride.employee_id,
        organisationId: existingOverride.organisation_id,
        beforeState: { override_active: true },
        afterState: { override_active: false, revoked_by: user.id },
      });

      return { success: true };
    } catch (err) {
      console.error('[ComplianceService] Override revocation error:', err);
      return { success: false, error: 'Failed to revoke override' };
    }
  }

  /**
   * Get active overrides for an employee
   */
  async getActiveOverrides(employeeId: string) {
    const { data, error } = await supabase
      .from('compliance_overrides')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ComplianceService] Failed to fetch overrides:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get human-readable certification name
   */
  getCertificationDisplayName(type: string): string {
    const names: Record<string, string> = {
      police_check: 'Police Check',
      ndis_screening: 'NDIS Worker Screening',
      first_aid: 'First Aid Certificate',
      cpr: 'CPR Certificate',
      wwcc: 'Working With Children Check',
      drivers_license: "Driver's License",
      wwcc_vic: 'WWCC Victoria',
      wwcc_nsw: 'WWCC NSW',
    };
    return names[type.toLowerCase()] || type;
  }

  /**
   * Get status display info
   */
  getStatusDisplay(status: CertificationStatus['status']): { label: string; variant: 'destructive' | 'outline' | 'secondary' } {
    switch (status) {
      case 'missing':
        return { label: 'Missing', variant: 'destructive' };
      case 'expired':
        return { label: 'Expired', variant: 'destructive' };
      case 'rejected':
        return { label: 'Rejected', variant: 'destructive' };
      case 'pending':
        return { label: 'Pending Approval', variant: 'outline' };
      case 'expiring_soon':
        return { label: 'Expiring Soon', variant: 'outline' };
      default:
        return { label: 'Valid', variant: 'secondary' };
    }
  }
}

// Export singleton instance
export const complianceService = new ComplianceService();
