import { FileText, Download, Mail, Clock, CheckCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ContractAuditTrail } from './ContractAuditTrail';
import { Contract, Signature, ContractAuditLog, ContractStatus } from '@/types/contracts';
import { format } from 'date-fns';

interface ContractViewSheetProps {
  contract: Contract | null;
  signature: Signature | null;
  auditLogs: ContractAuditLog[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<ContractStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  pending_signature: { label: 'Pending Signature', variant: 'default' },
  signed: { label: 'Signed', variant: 'outline' },
  expired: { label: 'Expired', variant: 'destructive' },
  voided: { label: 'Voided', variant: 'destructive' },
};

export function ContractViewSheet({ 
  contract, 
  signature, 
  auditLogs, 
  open, 
  onOpenChange 
}: ContractViewSheetProps) {
  if (!contract) return null;

  const config = statusConfig[contract.status];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <SheetTitle>{contract.title}</SheetTitle>
              <SheetDescription>{contract.position}</SheetDescription>
            </div>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Contract Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Contract Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Employee</p>
                  <p className="font-medium">{contract.employee_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{contract.employee_email}</p>
                </div>
                {contract.department && (
                  <div>
                    <p className="text-muted-foreground">Department</p>
                    <p className="font-medium">{contract.department}</p>
                  </div>
                )}
                {contract.employment_type && (
                  <div>
                    <p className="text-muted-foreground">Employment Type</p>
                    <p className="font-medium capitalize">{contract.employment_type.replace('_', ' ')}</p>
                  </div>
                )}
                {contract.start_date && (
                  <div>
                    <p className="text-muted-foreground">Start Date</p>
                    <p className="font-medium">{format(new Date(contract.start_date), 'MMMM d, yyyy')}</p>
                  </div>
                )}
                {contract.pay_rate && (
                  <div>
                    <p className="text-muted-foreground">Pay Rate</p>
                    <p className="font-medium">${contract.pay_rate}/hr</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Contract Content */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Contract Content</h3>
              <div className="p-4 rounded-lg bg-muted/30 text-sm whitespace-pre-wrap">
                {contract.content}
              </div>
            </div>

            {/* Signature Section */}
            {signature && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Signature
                  </h3>
                  <div className="p-4 rounded-lg border border-border bg-background">
                    <div className="space-y-3">
                      <div className="flex justify-center">
                        <img 
                          src={signature.signature_data} 
                          alt="Signature" 
                          className="max-h-20 object-contain"
                        />
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Signer</p>
                          <p className="font-medium">{signature.signer_name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date Signed</p>
                          <p className="font-medium">{format(new Date(signature.signed_at), 'MMM d, yyyy h:mm a')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Signature Type</p>
                          <p className="font-medium capitalize">{signature.signature_type}</p>
                        </div>
                        {signature.ip_address && (
                          <div>
                            <p className="text-muted-foreground">IP Address</p>
                            <p className="font-medium">{signature.ip_address}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Audit Trail */}
            <ContractAuditTrail auditLogs={auditLogs} />

            {/* Timestamps */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Created: {format(new Date(contract.created_at), 'MMM d, yyyy h:mm a')}
              </p>
              {contract.signed_at && (
                <p className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Signed: {format(new Date(contract.signed_at), 'MMM d, yyyy h:mm a')}
                </p>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          {contract.status === 'pending_signature' && (
            <Button variant="outline" className="flex-1">
              <Mail className="h-4 w-4 mr-2" />
              Resend
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
