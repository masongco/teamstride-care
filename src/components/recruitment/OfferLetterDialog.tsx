import { useMemo, useState } from 'react';
import { Send, FileSignature, Download, Eye, Loader2 } from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';

// Avoid TypeScript "excessively deep" instantiation from generated Supabase types
const db = supabase as any;

type ApplicantStage =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'reference_check'
  | 'offer'
  | 'hired'
  | 'rejected';

export type ApplicantRow = {
  id: string;
  organisation_id?: string;
  job_posting_id?: string;

  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;

  stage: ApplicantStage;
  source: string | null;
  notes: string | null;

  created_at: string;
  updated_at?: string;
};

interface OfferLetterDialogProps {
  applicant: ApplicantRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OfferLetterDialog({ applicant, open, onOpenChange }: OfferLetterDialogProps) {
  const [step, setStep] = useState<'details' | 'preview'>('details');

  // Minimal offer inputs (stored inside the generated content for now)
  const [positionTitle, setPositionTitle] = useState('');
  const [payRate, setPayRate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullName = useMemo(() => {
    if (!applicant) return '';
    return `${applicant.first_name} ${applicant.last_name}`.trim();
  }, [applicant]);

  const loadOrganisationId = async (): Promise<string> => {
    if (applicant?.organisation_id) return applicant.organisation_id;

    const { data: sessionData, error: sessionErr } = await db.auth.getSession();
    if (sessionErr) throw sessionErr;

    const user = sessionData.session?.user;
    if (!user) throw new Error('Not authenticated');

    const { data: organisationId, error: orgErr } = await db.rpc(
      'get_user_organisation_id',
      { _user_id: user.id },
    );
    if (orgErr) throw orgErr;
    if (!organisationId) throw new Error('Missing organisation_id for user');

    return organisationId;
  };

  const buildOfferContent = () => {
    const companyName = 'Your Company';
    const pos = positionTitle.trim() || 'the role';

    const details: string[] = [];
    if (pos) details.push(`Position: ${pos}`);
    if (payRate.trim()) details.push(`Pay Rate: $${payRate.trim()} per hour`);
    if (startDate) details.push(`Start Date: ${startDate}`);
    if (expiryDate) details.push(`Offer Expiry Date: ${expiryDate}`);

    const detailBlock = details.length
      ? details.map((d) => `- ${d}`).join('\n')
      : '- Position: (to be confirmed)';

    const extra = additionalNotes.trim();

    return [
      `Dear ${fullName || 'Candidate'},`,
      '',
      `We are pleased to offer you the position of ${pos} at ${companyName}.`,
      '',
      'Offer details:',
      detailBlock,
      '',
      'This offer is contingent upon completion of any required pre-employment checks.',
      '',
      extra ? `Additional notes:\n${extra}` : null,
      '',
      'Please confirm your acceptance of this offer by replying to this letter or signing and returning it by the expiry date.',
      '',
      'Sincerely,',
      companyName,
    ]
      .filter(Boolean)
      .join('\n');
  };

  const saveOffer = async (status: 'draft' | 'sent') => {
    if (!applicant) return;

    setError(null);
    setSubmitting(true);

    try {
      const orgId = await loadOrganisationId();
      const content = buildOfferContent();

      const { error: insErr } = await db.from('recruitment_offer_letters').insert({
        organisation_id: orgId,
        applicant_id: applicant.id,
        status: status === 'sent' ? 'sent' : 'draft',
        content,
      });

      if (insErr) throw insErr;

      // Close on success
      setStep('details');
      setPositionTitle('');
      setPayRate('');
      setStartDate('');
      setExpiryDate('');
      setAdditionalNotes('');
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save offer letter');
    } finally {
      setSubmitting(false);
    }
  };

  // If your table enum does NOT include 'sent', keep a safe fallback:
  // We'll attempt 'sent' first; if it fails, user can still save as draft.
  const sendOffer = async () => {
    try {
      await saveOffer('sent');
    } catch {
      // no-op (errors already set)
    }
  };

  const previewContent = useMemo(() => buildOfferContent(), [
    fullName,
    positionTitle,
    payRate,
    startDate,
    expiryDate,
    additionalNotes,
  ]);

  if (!applicant) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setError(null);
          setStep('details');
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Offer Letter
          </DialogTitle>
          <DialogDescription>Create an offer letter for {fullName || 'candidate'}.</DialogDescription>
        </DialogHeader>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {step === 'details' ? (
          <div className="space-y-6 py-4">
            {/* Position Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Position Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Position Title</Label>
                  <Input
                    id="position"
                    value={positionTitle}
                    onChange={(e) => setPositionTitle(e.target.value)}
                    placeholder="e.g. Support Worker"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay-rate">Pay Rate ($/hr)</Label>
                  <Input
                    id="pay-rate"
                    type="number"
                    inputMode="decimal"
                    value={payRate}
                    onChange={(e) => setPayRate(e.target.value)}
                    placeholder="e.g. 40.00"
                  />
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
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry-date">Offer Expiry Date</Label>
                  <Input
                    id="expiry-date"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
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
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="outline" onClick={() => setStep('preview')} disabled={submitting}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                className="flex-1 gradient-primary"
                onClick={() => saveOffer('draft')}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Save Draft
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
                  <h2 className="text-xl font-bold">Employment Offer Letter</h2>
                  <p className="text-sm text-muted-foreground">Draft preview</p>
                </div>

                <div className="space-y-3 text-sm whitespace-pre-wrap">{previewContent}</div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('details')} disabled={submitting}>
                Back to Edit
              </Button>
              <Button variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button className="flex-1 gradient-primary" onClick={sendOffer} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Save as Sent
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
