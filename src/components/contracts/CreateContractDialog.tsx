import { useState } from 'react';
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

interface CreateContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function CreateContractDialog({ open, onOpenChange, onCreate }: CreateContractDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    employee_name: '',
    employee_email: '',
    position: '',
    department: '',
    start_date: '',
    pay_rate: '',
    employment_type: 'casual',
    content: defaultContractContent,
  });

  const handleSubmit = async (asDraft: boolean) => {
    setIsSubmitting(true);
    try {
      await onCreate({
        title: formData.title || `Employment Contract - ${formData.employee_name}`,
        content: formData.content,
        employee_name: formData.employee_name,
        employee_email: formData.employee_email,
        position: formData.position,
        department: formData.department || undefined,
        start_date: formData.start_date || undefined,
        pay_rate: formData.pay_rate ? parseFloat(formData.pay_rate) : undefined,
        employment_type: formData.employment_type,
      });
      onOpenChange(false);
      // Reset form
      setFormData({
        title: '',
        employee_name: '',
        employee_email: '',
        position: '',
        department: '',
        start_date: '',
        pay_rate: '',
        employment_type: 'casual',
        content: defaultContractContent,
      });
    } catch (error) {
      console.error('Failed to create contract:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = formData.employee_name && formData.employee_email && formData.position && formData.content;

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
                  onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_email">Employee Email *</Label>
                <Input
                  id="employee_email"
                  type="email"
                  value={formData.employee_email}
                  onChange={(e) => setFormData({ ...formData, employee_email: e.target.value })}
                  placeholder="john@example.com"
                />
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
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Support Worker"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Disability Services"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select 
                  value={formData.employment_type} 
                  onValueChange={(v) => setFormData({ ...formData, employment_type: v })}
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
                  type="number"
                  step="0.01"
                  value={formData.pay_rate}
                  onChange={(e) => setFormData({ ...formData, pay_rate: e.target.value })}
                  placeholder="40.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Contract Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Auto-generated if empty"
                />
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
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="min-h-[200px] font-mono text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleSubmit(true)}
              disabled={!isValid || isSubmitting}
            >
              Save as Draft
            </Button>
            <Button 
              className="flex-1 gradient-primary"
              onClick={() => handleSubmit(false)}
              disabled={!isValid || isSubmitting}
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
