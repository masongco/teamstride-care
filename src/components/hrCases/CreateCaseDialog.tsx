import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useEmployees } from '@/hooks/useEmployees';
import type { 
  CreateHRCaseInput, 
  HRCaseType, 
  HRCaseSeverity, 
  HRCaseReporterType,
  HRCaseConfidentiality,
  CASE_TYPE_LABELS,
  CASE_SEVERITY_LABELS,
  REPORTER_TYPE_LABELS,
} from '@/types/hrCases';

interface CreateCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateHRCaseInput) => Promise<unknown>;
  organisationId: string;
}

const CASE_TYPES: { value: HRCaseType; label: string }[] = [
  { value: 'incident', label: 'Incident' },
  { value: 'misconduct', label: 'Misconduct' },
  { value: 'grievance', label: 'Grievance' },
  { value: 'performance', label: 'Performance' },
  { value: 'complaint', label: 'Complaint' },
];

const SEVERITIES: { value: HRCaseSeverity; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const REPORTER_TYPES: { value: HRCaseReporterType; label: string }[] = [
  { value: 'manager', label: 'Manager' },
  { value: 'employee', label: 'Employee' },
  { value: 'external', label: 'External' },
  { value: 'anonymous', label: 'Anonymous' },
];

export function CreateCaseDialog({ open, onOpenChange, onSubmit, organisationId }: CreateCaseDialogProps) {
  const [loading, setLoading] = useState(false);
  const { employees } = useEmployees();
  const { toast } = useToast();

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<CreateHRCaseInput>({
    defaultValues: {
      organisation_id: organisationId,
      case_type: 'incident',
      reported_by: 'manager',
      severity: 'medium',
      safeguarding_flag: false,
      confidentiality_level: 'standard',
    },
  });

  const reportedBy = watch('reported_by');
  const safeguardingFlag = watch('safeguarding_flag');

  const handleFormSubmit = async (data: CreateHRCaseInput) => {
    setLoading(true);
    try {
      await onSubmit(data);
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating case:', error);
      toast({
        title: 'Error',
        description: 'Failed to create case',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create HR Case</DialogTitle>
          <DialogDescription>
            Record a new incident, misconduct, grievance, or disciplinary matter.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="case_type">Case Type *</Label>
              <Select
                value={watch('case_type')}
                onValueChange={(value) => setValue('case_type', value as HRCaseType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CASE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity *</Label>
              <Select
                value={watch('severity')}
                onValueChange={(value) => setValue('severity', value as HRCaseSeverity)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((sev) => (
                    <SelectItem key={sev.value} value={sev.value}>
                      {sev.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee_id">Employee Involved</Label>
            <Select
              value={watch('employee_id') || ''}
              onValueChange={(value) => setValue('employee_id', value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No specific employee</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary *</Label>
            <Input
              id="summary"
              {...register('summary', { required: 'Summary is required' })}
              placeholder="Brief description of the case"
            />
            {errors.summary && (
              <p className="text-sm text-destructive">{errors.summary.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="detailed_description">Detailed Description</Label>
            <Textarea
              id="detailed_description"
              {...register('detailed_description')}
              placeholder="Provide full details of the incident or matter..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reported_by">Reported By *</Label>
              <Select
                value={reportedBy}
                onValueChange={(value) => setValue('reported_by', value as HRCaseReporterType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORTER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_reported">Date Reported</Label>
              <Input
                id="date_reported"
                type="date"
                {...register('date_reported')}
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {reportedBy !== 'anonymous' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reporter_name">Reporter Name</Label>
                <Input
                  id="reporter_name"
                  {...register('reporter_name')}
                  placeholder="Name of reporter"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reporter_contact">Reporter Contact</Label>
                <Input
                  id="reporter_contact"
                  {...register('reporter_contact')}
                  placeholder="Phone or email"
                />
              </div>
            </div>
          )}

          <div className="space-y-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="safeguarding_flag" className="text-destructive font-medium">
                  Safeguarding Concern
                </Label>
                <p className="text-sm text-muted-foreground">
                  Flag if this case involves child safety or vulnerable persons
                </p>
              </div>
              <Switch
                id="safeguarding_flag"
                checked={safeguardingFlag}
                onCheckedChange={(checked) => setValue('safeguarding_flag', checked)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confidentiality_level">Confidentiality Level</Label>
            <Select
              value={watch('confidentiality_level')}
              onValueChange={(value) => setValue('confidentiality_level', value as HRCaseConfidentiality)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="restricted">Restricted (Admin Only)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Case'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
