import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scale, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { HRCase, HRCaseFindings, CreateFindingsInput, HRCaseSubstantiation, SUBSTANTIATION_LABELS } from '@/types/hrCases';

interface CaseFindingsTabProps {
  hrCase: HRCase;
  findings: HRCaseFindings | null;
  onRecordFindings: (input: Omit<CreateFindingsInput, 'hr_case_id'>) => Promise<boolean>;
}

const SUBSTANTIATION_OPTIONS: { value: HRCaseSubstantiation; label: string; icon: typeof CheckCircle }[] = [
  { value: 'yes', label: 'Substantiated', icon: CheckCircle },
  { value: 'no', label: 'Not Substantiated', icon: XCircle },
  { value: 'partially', label: 'Partially Substantiated', icon: AlertTriangle },
];

export function CaseFindingsTab({ hrCase, findings, onRecordFindings }: CaseFindingsTabProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, reset } = useForm<Omit<CreateFindingsInput, 'hr_case_id'>>({
    defaultValues: {
      findings_summary: '',
      substantiated: 'no',
      contributing_factors: '',
    },
  });

  const handleFormSubmit = async (data: Omit<CreateFindingsInput, 'hr_case_id'>) => {
    setLoading(true);
    try {
      const success = await onRecordFindings(data);
      if (success) {
        setEditing(false);
        reset();
      }
    } finally {
      setLoading(false);
    }
  };

  const getSubstantiationColor = (value: HRCaseSubstantiation) => {
    switch (value) {
      case 'yes': return 'bg-red-500 text-white';
      case 'no': return 'bg-green-500 text-white';
      case 'partially': return 'bg-amber-500 text-black';
    }
  };

  if (findings) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Case Findings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Outcome:</span>
              <Badge className={getSubstantiationColor(findings.substantiated)}>
                {SUBSTANTIATION_OPTIONS.find(o => o.value === findings.substantiated)?.label}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Decision Date</p>
              <p className="text-sm font-medium">
                {format(new Date(findings.decision_date), 'dd MMM yyyy')}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Decision Maker</p>
              <p className="text-sm font-medium">{findings.decision_maker_name || 'Unknown'}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Findings Summary</p>
              <p className="text-sm whitespace-pre-wrap">{findings.findings_summary}</p>
            </div>

            {findings.contributing_factors && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Contributing Factors</p>
                <p className="text-sm whitespace-pre-wrap">{findings.contributing_factors}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!editing) {
    return (
      <div className="space-y-4">
        {hrCase.status === 'closed' ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-4">
              <p className="text-amber-800">
                Case was closed without findings recorded. This is unusual for a closed case.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center gap-3 py-6">
              <Scale className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">No Findings Recorded</p>
                <p className="text-sm text-muted-foreground">
                  Record findings once the investigation is complete.
                </p>
              </div>
              <Button onClick={() => setEditing(true)}>
                Record Findings
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Record Findings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="substantiated">Outcome *</Label>
            <Select
              value={watch('substantiated')}
              onValueChange={(value) => setValue('substantiated', value as HRCaseSubstantiation)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBSTANTIATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="findings_summary">Findings Summary *</Label>
            <Textarea
              id="findings_summary"
              {...register('findings_summary', { required: true })}
              placeholder="Summarize the findings of the investigation..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contributing_factors">Contributing Factors</Label>
            <Textarea
              id="contributing_factors"
              {...register('contributing_factors')}
              placeholder="Identify any contributing factors or systemic issues..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Record Findings'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
