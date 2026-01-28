import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { HRCase, HRCaseTriage, CreateTriageInput } from '@/types/hrCases';

interface CaseTriageTabProps {
  hrCase: HRCase;
  triage: HRCaseTriage | null;
  onCreateTriage: (input: Omit<CreateTriageInput, 'hr_case_id'>) => Promise<boolean>;
}

export function CaseTriageTab({ hrCase, triage, onCreateTriage }: CaseTriageTabProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, reset } = useForm<Omit<CreateTriageInput, 'hr_case_id'>>({
    defaultValues: {
      initial_risk_assessment: '',
      immediate_actions_taken: '',
      escalation_required: false,
      escalated_to: '',
    },
  });

  const escalationRequired = watch('escalation_required');

  const requiresTriage = hrCase.case_type === 'misconduct' || 
                         hrCase.severity === 'high' || 
                         hrCase.severity === 'critical';

  const handleFormSubmit = async (data: Omit<CreateTriageInput, 'hr_case_id'>) => {
    setLoading(true);
    try {
      const success = await onCreateTriage(data);
      if (success) {
        setEditing(false);
        reset();
      }
    } finally {
      setLoading(false);
    }
  };

  if (triage) {
    return (
      <div className="space-y-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              Triage Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Triaged At</p>
              <p className="text-sm font-medium">
                {format(new Date(triage.triaged_at), 'dd MMM yyyy HH:mm')}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Risk Assessment</p>
              <p className="text-sm">{triage.initial_risk_assessment}</p>
            </div>

            {triage.immediate_actions_taken && (
              <div>
                <p className="text-sm text-muted-foreground">Immediate Actions Taken</p>
                <p className="text-sm">{triage.immediate_actions_taken}</p>
              </div>
            )}

            {triage.escalation_required && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-orange-800">Escalation Required</span>
                </div>
                {triage.escalated_to && (
                  <p className="text-sm text-orange-700 mt-1">
                    Escalated to: {triage.escalated_to}
                  </p>
                )}
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
        {requiresTriage && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div className="flex-1">
                <p className="font-medium text-amber-800">Triage Required</p>
                <p className="text-sm text-amber-700">
                  This case requires triage due to its type or severity.
                </p>
              </div>
              <Button onClick={() => setEditing(true)}>
                Begin Triage
              </Button>
            </CardContent>
          </Card>
        )}

        {!requiresTriage && (
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">No Triage Required</p>
                <p className="text-sm text-muted-foreground">
                  This case does not require mandatory triage, but you can still complete one if needed.
                </p>
              </div>
              <Button variant="outline" onClick={() => setEditing(true)}>
                Add Triage
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
        <CardTitle className="text-base">Complete Triage</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="initial_risk_assessment">Initial Risk Assessment *</Label>
            <Textarea
              id="initial_risk_assessment"
              {...register('initial_risk_assessment', { required: true })}
              placeholder="Assess the immediate risks and potential impacts..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="immediate_actions_taken">Immediate Actions Taken</Label>
            <Textarea
              id="immediate_actions_taken"
              {...register('immediate_actions_taken')}
              placeholder="Document any immediate actions taken to address the situation..."
              rows={3}
            />
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="escalation_required">Escalation Required</Label>
                <p className="text-sm text-muted-foreground">
                  Does this case need to be escalated to external bodies or senior leadership?
                </p>
              </div>
              <Switch
                id="escalation_required"
                checked={escalationRequired}
                onCheckedChange={(checked) => setValue('escalation_required', checked)}
              />
            </div>

            {escalationRequired && (
              <div className="space-y-2">
                <Label htmlFor="escalated_to">Escalated To</Label>
                <Input
                  id="escalated_to"
                  {...register('escalated_to')}
                  placeholder="e.g., NDIS Quality & Safeguards Commission, Police, etc."
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Complete Triage'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
