import { useEffect, useState } from 'react';
import { FilePlus, Send } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { contractSchema, type ContractFormData } from '@/lib/validation-schemas';

interface CreateContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Partial<ContractFormData>;
  onCreate: (contract: {
    title: string;
    content: string;
    employee_name: string;
    employee_email: string;
    position: string;
    department?: string;
    start_date?: string;
    pay_rate?: number;
    employment_type?: string;
  }) => Promise<void>;
}

const defaultContractContent = `EMPLOYMENT CONTRACT

This Employment Agreement ("Agreement") is entered into between Social Plus Support Work ("Employer") and the Employee named below.

TERMS OF EMPLOYMENT:

1. POSITION AND DUTIES
   The Employee agrees to perform the duties and responsibilities associated with the position stated above, and such other duties as may be reasonably assigned.

2. COMPENSATION
   The Employee will be compensated at the rate specified above, paid in accordance with the Employer's standard payroll practices.

3. WORKING HOURS
   Working hours will be determined based on client needs and roster schedules. The Employee agrees to maintain availability as reasonably required.

4. CONFIDENTIALITY
   The Employee agrees to maintain strict confidentiality of all client information, business operations, and proprietary information.

5. COMPLIANCE
   The Employee agrees to maintain all required certifications and clearances, including NDIS Worker Screening Check.

6. TERMINATION
   Either party may terminate this agreement with appropriate notice as required by the relevant Award or legislation.

By signing this agreement, both parties acknowledge and agree to the terms outlined above.`;

const initialFormData: ContractFormData = {
  title: '',
  employee_name: '',
  employee_email: '',
  position: '',
  department: '',
  start_date: '',
  pay_rate: '',
  employment_type: 'casual',
  content: defaultContractContent,
};

export function CreateContractDialog({
  open,
  onOpenChange,
  onCreate,
  initialValues,
}: CreateContractDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ContractFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof ContractFormData, string>>>({});
  useEffect(() => {
    if (!open) {
      setFormData(initialFormData);
      setErrors({});
      return;
    }

    if (initialValues) {
      setFormData({
        ...initialFormData,
        ...initialValues,
        content: initialValues.content || initialFormData.content,
      });
      setErrors({});
    }
  }, [open, initialValues]);

  const validateForm = (): boolean => {
    const result = contractSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContractFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof ContractFormData;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleSubmit = async (asDraft: boolean) => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        title: formData.title?.trim() || `Employment Contract - ${formData.employee_name.trim()}`,
        content: formData.content.trim(),
        employee_name: formData.employee_name.trim(),
        employee_email: formData.employee_email.trim(),
        position: formData.position.trim(),
        department: formData.department?.trim() || undefined,
        start_date: formData.start_date || undefined,
        pay_rate: formData.pay_rate ? parseFloat(formData.pay_rate) : undefined,
        employment_type: formData.employment_type,
      });
      onOpenChange(false);
      // Reset form
      setFormData(initialFormData);
      setErrors({});
    } catch (error) {
      console.error('Failed to create contract:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field: keyof ContractFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when field is modified
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePlus className="h-5 w-5 text-primary" />
            Create Employment Contract
          </DialogTitle>
          <DialogDescription>
            Create a new employment contract for signing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Employee Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Employee Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_name">Employee Name *</Label>
                <Input
                  id="employee_name"
                  value={formData.employee_name}
                  onChange={(e) => handleFieldChange('employee_name', e.target.value)}
                  placeholder="John Smith"
                  className={errors.employee_name ? 'border-destructive' : ''}
                  maxLength={100}
                />
                {errors.employee_name && (
                  <p className="text-xs text-destructive">{errors.employee_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_email">Employee Email *</Label>
                <Input
                  id="employee_email"
                  type="email"
                  value={formData.employee_email}
                  onChange={(e) => handleFieldChange('employee_email', e.target.value)}
                  placeholder="john@example.com"
                  className={errors.employee_email ? 'border-destructive' : ''}
                  maxLength={255}
                />
                {errors.employee_email && (
                  <p className="text-xs text-destructive">{errors.employee_email}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Position Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Position Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position Title *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleFieldChange('position', e.target.value)}
                  placeholder="Support Worker"
                  className={errors.position ? 'border-destructive' : ''}
                  maxLength={100}
                />
                {errors.position && (
                  <p className="text-xs text-destructive">{errors.position}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department || ''}
                  onChange={(e) => handleFieldChange('department', e.target.value)}
                  placeholder="Disability Services"
                  className={errors.department ? 'border-destructive' : ''}
                  maxLength={100}
                />
                {errors.department && (
                  <p className="text-xs text-destructive">{errors.department}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select 
                  value={formData.employment_type} 
                  onValueChange={(v) => handleFieldChange('employment_type', v as ContractFormData['employment_type'])}
                >
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
              <div className="space-y-2">
                <Label htmlFor="pay_rate">Pay Rate ($/hr)</Label>
                <Input
                  id="pay_rate"
                  type="text"
                  inputMode="decimal"
                  value={formData.pay_rate || ''}
                  onChange={(e) => handleFieldChange('pay_rate', e.target.value)}
                  placeholder="40.00"
                  className={errors.pay_rate ? 'border-destructive' : ''}
                />
                {errors.pay_rate && (
                  <p className="text-xs text-destructive">{errors.pay_rate}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date || ''}
                  onChange={(e) => handleFieldChange('start_date', e.target.value)}
                  className={errors.start_date ? 'border-destructive' : ''}
                />
                {errors.start_date && (
                  <p className="text-xs text-destructive">{errors.start_date}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Contract Title</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder="Auto-generated if empty"
                  className={errors.title ? 'border-destructive' : ''}
                  maxLength={200}
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Contract Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Contract Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleFieldChange('content', e.target.value)}
              className={`min-h-[200px] font-mono text-xs ${errors.content ? 'border-destructive' : ''}`}
              maxLength={50000}
            />
            {errors.content && (
              <p className="text-xs text-destructive">{errors.content}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.content.length.toLocaleString()} / 50,000 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
            >
              Save as Draft
            </Button>
            <Button 
              className="flex-1 gradient-primary"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
            >
              <Send className="h-4 w-4 mr-2" />
              Create & Send for Signature
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
