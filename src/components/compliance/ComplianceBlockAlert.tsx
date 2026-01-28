import { useState } from 'react';
import { AlertTriangle, ShieldAlert, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ComplianceResult, CertificationStatus } from '@/services/complianceService';
import { complianceService } from '@/services/complianceService';
import { ComplianceOverrideDialog } from './ComplianceOverrideDialog';

interface ComplianceBlockAlertProps {
  result: ComplianceResult;
  employeeId: string;
  employeeName: string;
  contextType: 'shift' | 'client' | 'service' | 'general';
  contextId?: string;
  canOverride?: boolean;
  onOverrideSuccess?: () => void;
}

export function ComplianceBlockAlert({
  result,
  employeeId,
  employeeName,
  contextType,
  contextId,
  canOverride = false,
  onOverrideSuccess,
}: ComplianceBlockAlertProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);

  if (result.compliant && result.expiringSoon.length === 0) {
    return null;
  }

  const hasBlockingIssues = result.blockingReasons.length > 0;
  const hasExpiringSoon = result.expiringSoon.length > 0;

  const renderCertificationStatus = (cert: CertificationStatus) => {
    const displayName = complianceService.getCertificationDisplayName(cert.type);
    const { label, variant } = complianceService.getStatusDisplay(cert.status);

    return (
      <div key={cert.type} className="flex items-center justify-between py-1">
        <span className="text-sm">{displayName}</span>
        <div className="flex items-center gap-2">
          <Badge variant={variant as "destructive" | "outline" | "secondary" | "default"}>{label}</Badge>
          {cert.expiryDate && (
            <span className="text-xs text-muted-foreground">
              {cert.status === 'expired' ? 'Expired' : 'Expires'}: {new Date(cert.expiryDate).toLocaleDateString()}
            </span>
          )}
          {cert.daysUntilExpiry !== undefined && (
            <span className="text-xs text-muted-foreground">
              ({cert.daysUntilExpiry} days)
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Alert variant={hasBlockingIssues ? "destructive" : "default"} className="my-4">
        <div className="flex items-start gap-3">
          {hasBlockingIssues ? (
            <ShieldAlert className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
          <div className="flex-1">
            <AlertTitle className="flex items-center gap-2">
              {hasBlockingIssues ? 'Compliance Block' : 'Compliance Warning'}
              {result.overrideActive && (
                <Badge variant="outline" className="ml-2">
                  <Clock className="h-3 w-3 mr-1" />
                  Override Active
                </Badge>
              )}
            </AlertTitle>
            <AlertDescription>
              {hasBlockingIssues && !result.overrideActive && (
                <p className="mt-1">
                  {employeeName} cannot be assigned due to compliance issues.
                </p>
              )}
              {hasBlockingIssues && result.overrideActive && (
                <p className="mt-1 text-muted-foreground">
                  Override in effect until {new Date(result.overrideDetails!.expiresAt).toLocaleDateString()}.
                  Reason: {result.overrideDetails!.reason}
                </p>
              )}
              {!hasBlockingIssues && hasExpiringSoon && (
                <p className="mt-1">
                  Some certifications are expiring soon. Please ensure renewals are in progress.
                </p>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="mt-2 p-0 h-auto"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? (
                  <>Hide Details <ChevronUp className="h-4 w-4 ml-1" /></>
                ) : (
                  <>View Details <ChevronDown className="h-4 w-4 ml-1" /></>
                )}
              </Button>

              {showDetails && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  {hasBlockingIssues && (
                    <div>
                      <p className="text-sm font-medium mb-2">Blocking Issues:</p>
                      <div className="space-y-1">
                        {result.blockingReasons.map(renderCertificationStatus)}
                      </div>
                    </div>
                  )}
                  {hasExpiringSoon && (
                    <div className={hasBlockingIssues ? 'mt-4' : ''}>
                      <p className="text-sm font-medium mb-2">Expiring Soon:</p>
                      <div className="space-y-1">
                        {result.expiringSoon.map(renderCertificationStatus)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {hasBlockingIssues && canOverride && !result.overrideActive && (
                <div className="mt-4 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOverrideDialogOpen(true)}
                  >
                    <ShieldAlert className="h-4 w-4 mr-2" />
                    Create Override
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only Admin or Director can override compliance blocks.
                  </p>
                </div>
              )}
            </AlertDescription>
          </div>
        </div>
      </Alert>

      <ComplianceOverrideDialog
        open={overrideDialogOpen}
        onOpenChange={setOverrideDialogOpen}
        employeeId={employeeId}
        employeeName={employeeName}
        blockingReasons={result.blockingReasons}
        contextType={contextType}
        contextId={contextId}
        onSuccess={() => {
          setOverrideDialogOpen(false);
          onOverrideSuccess?.();
        }}
      />
    </>
  );
}
