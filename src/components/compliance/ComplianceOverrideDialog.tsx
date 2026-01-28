import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { CalendarIcon, ShieldAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CertificationStatus } from '@/services/complianceService';
import { complianceService } from '@/services/complianceService';
import { useComplianceEnforcement } from '@/hooks/useComplianceEnforcement';

interface ComplianceOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  blockingReasons: CertificationStatus[];
  contextType: 'shift' | 'client' | 'service' | 'general';
  contextId?: string;
  onSuccess: () => void;
}

export function ComplianceOverrideDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  blockingReasons,
  contextType,
  contextId,
  onSuccess,
}: ComplianceOverrideDialogProps) {
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(addDays(new Date(), 7));
  const [submitting, setSubmitting] = useState(false);

  const { createOverride } = useComplianceEnforcement();

  const minDate = new Date();
  const maxDate = addDays(new Date(), 14);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    if (!expiresAt) return;

    setSubmitting(true);
    try {
      const success = await createOverride({
        employeeId,
        reason: reason.trim(),
        expiresAt,
        contextType,
        contextId,
        blockedCertifications: blockingReasons,
      });

      if (success) {
        setReason('');
        setExpiresAt(addDays(new Date(), 7));
        onSuccess();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Create Compliance Override
          </DialogTitle>
          <DialogDescription>
            Override compliance requirements for <strong>{employeeName}</strong>.
            This action will be logged for audit purposes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Blocked Certifications */}
          <div className="space-y-2">
            <Label>Certifications Being Overridden</Label>
            <div className="flex flex-wrap gap-2">
              {blockingReasons.map((cert) => {
                const displayName = complianceService.getCertificationDisplayName(cert.type);
                const { label, variant } = complianceService.getStatusDisplay(cert.status);
                return (
                  <Badge key={cert.type} variant={variant as "destructive" | "outline" | "secondary" | "default"}>
                    {displayName}: {label}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for Override <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Explain why this compliance override is necessary..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This reason will be recorded in the audit log.
            </p>
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label>
              Override Expires <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !expiresAt && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expiresAt ? format(expiresAt, 'PPP') : 'Select expiry date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expiresAt}
                  onSelect={setExpiresAt}
                  disabled={(date) => date < minDate || date > maxDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Maximum override duration is 14 days. Override will automatically expire.
            </p>
          </div>

          {/* Warning */}
          <div className="rounded-md bg-destructive/10 p-3 text-sm">
            <p className="font-medium text-destructive">Important:</p>
            <ul className="list-disc list-inside mt-1 text-muted-foreground">
              <li>This override will be recorded in the audit trail</li>
              <li>Assignment will be blocked again after expiry</li>
              <li>You remain responsible for ensuring safety compliance</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason.trim() || !expiresAt || submitting}
            variant="destructive"
          >
            {submitting ? 'Creating...' : 'Create Override'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
