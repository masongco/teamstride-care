import { useState } from 'react';
import { FileSignature, Check, AlertCircle, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SignaturePad } from './SignaturePad';
import { Contract } from '@/types/contracts';
import { format } from 'date-fns';

interface ContractSigningDialogProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSign: (contractId: string, signatureData: string, signatureType: 'drawn' | 'typed') => Promise<void>;
}

export function ContractSigningDialog({ 
  contract, 
  open, 
  onOpenChange,
  onSign 
}: ContractSigningDialogProps) {
  const [signatureData, setSignatureData] = useState('');
  const [signatureType, setSignatureType] = useState<'drawn' | 'typed'>('drawn');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!contract) return null;

  const handleSignatureChange = (data: string, type: 'drawn' | 'typed') => {
    setSignatureData(data);
    setSignatureType(type);
  };

  const handleSign = async () => {
    if (!signatureData || !agreedToTerms) return;
    
    setIsSubmitting(true);
    try {
      await onSign(contract.id, signatureData, signatureType);
      onOpenChange(false);
      // Reset state
      setSignatureData('');
      setAgreedToTerms(false);
    } catch (error) {
      console.error('Failed to sign contract:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSign = signatureData && agreedToTerms && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Sign Employment Contract
          </DialogTitle>
          <DialogDescription>
            Review and sign your employment contract with {contract.title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Contract Preview */}
          <div className="flex-1 min-h-0">
            <Label className="text-sm font-medium mb-2 block">Contract Document</Label>
            <ScrollArea className="h-64 border border-border rounded-lg bg-muted/30">
              <div className="p-4 space-y-4 text-sm">
                <div className="text-center border-b border-border pb-4">
                  <h2 className="text-lg font-bold">Employment Contract</h2>
                  <p className="text-muted-foreground">{contract.title}</p>
                </div>

                <div className="space-y-3">
                  <p><strong>Employee:</strong> {contract.employee_name}</p>
                  <p><strong>Position:</strong> {contract.position}</p>
                  {contract.department && (
                    <p><strong>Department:</strong> {contract.department}</p>
                  )}
                  {contract.employment_type && (
                    <p><strong>Employment Type:</strong> {contract.employment_type}</p>
                  )}
                  {contract.start_date && (
                    <p><strong>Start Date:</strong> {format(new Date(contract.start_date), 'MMMM d, yyyy')}</p>
                  )}
                  {contract.pay_rate && (
                    <p><strong>Pay Rate:</strong> ${contract.pay_rate.toFixed(2)}/hr</p>
                  )}
                </div>

                <Separator />

                <div className="whitespace-pre-wrap">{contract.content}</div>
              </div>
            </ScrollArea>
          </div>

          {/* Signature Section */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Your Signature</Label>
            <SignaturePad 
              onSignatureChange={handleSignatureChange}
              signerName={contract.employee_name}
            />
          </div>

          {/* Agreement Checkbox */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Checkbox
              id="agree-terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="agree-terms"
                className="text-sm font-medium leading-relaxed cursor-pointer"
              >
                I agree to the terms and conditions
              </Label>
              <p className="text-xs text-muted-foreground">
                By signing this document, I acknowledge that I have read and understood the 
                terms of this employment contract and agree to be bound by them.
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Your signature will be securely recorded along with timestamp, IP address, 
              and browser information for audit purposes.
            </AlertDescription>
          </Alert>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button 
            className="flex-1 gradient-primary" 
            onClick={handleSign}
            disabled={!canSign}
          >
            {isSubmitting ? (
              <>Signing...</>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Sign Contract
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
