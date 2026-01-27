import { useState } from 'react';
import { Send, FileSignature, Download, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Applicant } from '@/types/recruitment';

interface OfferLetterDialogProps {
  applicant: Applicant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OfferLetterDialog({ applicant, open, onOpenChange }: OfferLetterDialogProps) {
  const [step, setStep] = useState<'details' | 'preview'>('details');

  if (!applicant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Generate Offer Letter
          </DialogTitle>
          <DialogDescription>
            Create an offer letter for {applicant.firstName} {applicant.lastName}
          </DialogDescription>
        </DialogHeader>

        {step === 'details' ? (
          <div className="space-y-6 py-4">
            {/* Position Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Position Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Position Title</Label>
                  <Input id="position" defaultValue={applicant.jobTitle} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employment-type">Employment Type</Label>
                  <Select defaultValue="casual">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="part_time">Part-Time</SelectItem>
                      <SelectItem value="full_time">Full-Time</SelectItem>
                      <SelectItem value="contractor">Contractor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Compensation */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Compensation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pay-rate">Pay Rate ($/hr)</Label>
                  <Input id="pay-rate" type="number" placeholder="40.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="award">Award Classification</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select classification" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="level-1">Level 1.1</SelectItem>
                      <SelectItem value="level-2">Level 2.1</SelectItem>
                      <SelectItem value="level-3">Level 3.1</SelectItem>
                      <SelectItem value="level-4">Level 4.1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Dates */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Important Dates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Proposed Start Date</Label>
                  <Input id="start-date" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry-date">Offer Expiry Date</Label>
                  <Input id="expiry-date" type="date" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Any additional terms or notes to include..."
                className="min-h-[80px]"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="outline" onClick={() => setStep('preview')}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button className="flex-1 gradient-primary">
                <Send className="h-4 w-4 mr-2" />
                Send Offer Letter
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Preview */}
            <Card className="bg-muted/30">
              <CardContent className="pt-6 space-y-4">
                <div className="text-center border-b border-border pb-4">
                  <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">S+</span>
                  </div>
                  <h2 className="text-xl font-bold">Social Plus Support Work</h2>
                  <p className="text-sm text-muted-foreground">Employment Offer Letter</p>
                </div>

                <div className="space-y-3 text-sm">
                  <p>Dear {applicant.firstName} {applicant.lastName},</p>
                  
                  <p>
                    We are pleased to offer you the position of <strong>{applicant.jobTitle}</strong> at 
                    Social Plus Support Work. We were impressed with your qualifications and experience, 
                    and believe you will be a valuable addition to our team.
                  </p>

                  <div className="bg-background rounded-lg p-4 space-y-2">
                    <p><strong>Position:</strong> {applicant.jobTitle}</p>
                    <p><strong>Employment Type:</strong> Casual</p>
                    <p><strong>Pay Rate:</strong> $40.00 per hour</p>
                    <p><strong>Start Date:</strong> To be confirmed</p>
                  </div>

                  <p>
                    This offer is contingent upon satisfactory completion of pre-employment checks, 
                    including verification of your NDIS Worker Screening clearance and other 
                    required certifications.
                  </p>

                  <p>
                    Please confirm your acceptance of this offer by signing below and returning 
                    this letter by the specified date.
                  </p>

                  <div className="pt-4 space-y-4">
                    <div className="border-t border-border pt-4">
                      <p className="text-muted-foreground">Signature: ________________________</p>
                      <p className="text-muted-foreground mt-2">Date: ________________________</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('details')}>
                Back to Edit
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button className="flex-1 gradient-primary">
                <Send className="h-4 w-4 mr-2" />
                Send to Candidate
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
