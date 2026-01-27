import { useState } from 'react';
import { UserPlus } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { employeeSchema, type EmployeeFormData } from '@/lib/validation-schemas';

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (employee: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    position: string;
    department: string;
    employmentType: string;
    payRate: number;
  }) => void;
}

const initialFormData: EmployeeFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  position: '',
  department: '',
  employmentType: 'casual',
  payRate: '',
};

export function AddEmployeeDialog({ open, onOpenChange, onAdd }: AddEmployeeDialogProps) {
  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof EmployeeFormData, string>>>({});

  const validateForm = (): boolean => {
    const result = employeeSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof EmployeeFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof EmployeeFormData;
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

  const handleSubmit = () => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    onAdd({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone?.trim() || '',
      position: formData.position.trim(),
      department: formData.department?.trim() || '',
      employmentType: formData.employmentType,
      payRate: formData.payRate ? parseFloat(formData.payRate) : 0,
    });

    // Reset form
    setFormData(initialFormData);
    setErrors({});
    onOpenChange(false);
    
    toast({
      title: 'Employee Added',
      description: `${formData.firstName} ${formData.lastName} has been added to the system.`,
    });
  };

  const handleFieldChange = (field: keyof EmployeeFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when field is modified
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add New Employee
          </DialogTitle>
          <DialogDescription>
            Enter the details for the new employee
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleFieldChange('firstName', e.target.value)}
                  placeholder="John"
                  className={errors.firstName ? 'border-destructive' : ''}
                  maxLength={50}
                />
                {errors.firstName && (
                  <p className="text-xs text-destructive">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleFieldChange('lastName', e.target.value)}
                  placeholder="Smith"
                  className={errors.lastName ? 'border-destructive' : ''}
                  maxLength={50}
                />
                {errors.lastName && (
                  <p className="text-xs text-destructive">{errors.lastName}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  placeholder="john@example.com"
                  className={errors.email ? 'border-destructive' : ''}
                  maxLength={255}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  placeholder="0400 000 000"
                  className={errors.phone ? 'border-destructive' : ''}
                  maxLength={20}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Employment Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Employment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type</Label>
                <Select
                  value={formData.employmentType}
                  onValueChange={(v) => handleFieldChange('employmentType', v as EmployeeFormData['employmentType'])}
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
                <Label htmlFor="payRate">Pay Rate ($/hr)</Label>
                <Input
                  id="payRate"
                  type="text"
                  inputMode="decimal"
                  value={formData.payRate || ''}
                  onChange={(e) => handleFieldChange('payRate', e.target.value)}
                  placeholder="40.00"
                  className={errors.payRate ? 'border-destructive' : ''}
                />
                {errors.payRate && (
                  <p className="text-xs text-destructive">{errors.payRate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button className="flex-1 gradient-primary" onClick={handleSubmit}>
              Add Employee
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
