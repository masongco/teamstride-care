import { useState, useCallback } from 'react';
import { 
  complianceService, 
  ComplianceResult, 
  EvaluationContext, 
  OverrideRequest,
  CertificationStatus 
} from '@/services/complianceService';
import { toast } from 'sonner';

interface UseComplianceEnforcementReturn {
  evaluating: boolean;
  result: ComplianceResult | null;
  
  // Evaluation
  evaluateCompliance: (employeeId: string, context?: EvaluationContext) => Promise<ComplianceResult>;
  canAssign: (employeeId: string, context?: EvaluationContext) => Promise<boolean>;
  
  // Override management
  createOverride: (request: OverrideRequest) => Promise<boolean>;
  revokeOverride: (overrideId: string) => Promise<boolean>;
  
  // Helpers
  getBlockingMessage: (result: ComplianceResult) => string;
  getCertificationDisplayName: (type: string) => string;
  getStatusDisplay: (status: CertificationStatus['status']) => { label: string; variant: 'destructive' | 'outline' | 'secondary' };
}

/**
 * Hook for compliance enforcement in assignment workflows
 */
export function useComplianceEnforcement(): UseComplianceEnforcementReturn {
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);

  const evaluateCompliance = useCallback(async (
    employeeId: string, 
    context?: EvaluationContext
  ): Promise<ComplianceResult> => {
    setEvaluating(true);
    try {
      const complianceResult = await complianceService.evaluateCompliance(employeeId, context);
      setResult(complianceResult);
      return complianceResult;
    } finally {
      setEvaluating(false);
    }
  }, []);

  const canAssign = useCallback(async (
    employeeId: string,
    context?: EvaluationContext
  ): Promise<boolean> => {
    setEvaluating(true);
    try {
      const { allowed, result: complianceResult } = await complianceService.canAssign(employeeId, context);
      setResult(complianceResult);
      return allowed;
    } finally {
      setEvaluating(false);
    }
  }, []);

  const createOverride = useCallback(async (request: OverrideRequest): Promise<boolean> => {
    const { success, error } = await complianceService.createOverride(request);
    
    if (success) {
      toast.success('Compliance override created', {
        description: `Override active until ${request.expiresAt.toLocaleDateString()}`,
      });
    } else {
      toast.error('Failed to create override', {
        description: error,
      });
    }
    
    return success;
  }, []);

  const revokeOverride = useCallback(async (overrideId: string): Promise<boolean> => {
    const { success, error } = await complianceService.revokeOverride(overrideId);
    
    if (success) {
      toast.success('Override revoked');
    } else {
      toast.error('Failed to revoke override', {
        description: error,
      });
    }
    
    return success;
  }, []);

  const getBlockingMessage = useCallback((complianceResult: ComplianceResult): string => {
    if (complianceResult.compliant) return '';
    
    const issues = complianceResult.blockingReasons.map(r => {
      const name = complianceService.getCertificationDisplayName(r.type);
      const { label } = complianceService.getStatusDisplay(r.status);
      return `${name} (${label})`;
    });
    
    return `Assignment blocked: ${issues.join(', ')}`;
  }, []);

  return {
    evaluating,
    result,
    evaluateCompliance,
    canAssign,
    createOverride,
    revokeOverride,
    getBlockingMessage,
    getCertificationDisplayName: complianceService.getCertificationDisplayName,
    getStatusDisplay: complianceService.getStatusDisplay,
  };
}
