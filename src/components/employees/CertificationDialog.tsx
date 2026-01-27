import { useState, useRef } from 'react';
import { CalendarIcon, Upload, X, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Certification, ComplianceStatus } from '@/types/hrms';

const certificationTypes = [
  { value: 'police_check', label: 'Police Check', defaultValidityYears: 3 },
  { value: 'ndis_screening', label: 'NDIS Worker Screening', defaultValidityYears: 5 },
  { value: 'first_aid', label: 'First Aid Certificate', defaultValidityYears: 3 },
  { value: 'cpr', label: 'CPR Certificate', defaultValidityYears: 1 },
  { value: 'training', label: 'Training Certificate', defaultValidityYears: 2 },
  { value: 'other', label: 'Other', defaultValidityYears: 1 },
] as const;

const certificationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  type: z.enum(['police_check', 'ndis_screening', 'first_aid', 'cpr', 'training', 'other']),
  issueDate: z.date({ required_error: 'Issue date is required' }),
  expiryDate: z.date({ required_error: 'Expiry date is required' }),
});

interface CertificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certification?: Certification | null;
  onSave: (certification: Certification, documentFile?: File) => void;
  onDelete?: (certificationId: string) => void;
}

function calculateStatus(expiryDate: Date): ComplianceStatus {
  const today = new Date();
  const daysUntilExpiry = differenceInDays(expiryDate, today);
  
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'expiring';
  return 'compliant';
}

function getStatusIcon(status: ComplianceStatus) {
  switch (status) {
    case 'expired':
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case 'expiring':
      return <Clock className="h-4 w-4 text-warning" />;
    case 'compliant':
      return <CheckCircle className="h-4 w-4 text-success" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

export function CertificationDialog({ 
  open, 
  onOpenChange, 
  certification, 
  onSave, 
  onDelete 
}: CertificationDialogProps) {
  const isEditing = !!certification;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: certification?.name || '',
    type: certification?.type || 'police_check',
    issueDate: certification?.issueDate ? new Date(certification.issueDate) : undefined as Date | undefined,
    expiryDate: certification?.expiryDate ? new Date(certification.expiryDate) : undefined as Date | undefined,
  });
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeChange = (type: string) => {
    const certType = certificationTypes.find(t => t.value === type);
    const typedType = type as Certification['type'];
    
    // Auto-fill name based on type
    const autoName = certType?.label || '';
    
    // Auto-calculate expiry date if issue date is set
    let newExpiryDate = formData.expiryDate;
    if (formData.issueDate && certType) {
      newExpiryDate = addDays(formData.issueDate, certType.defaultValidityYears * 365);
    }
    
    setFormData({
      ...formData,
      type: typedType,
      name: formData.name || autoName,
      expiryDate: newExpiryDate,
    });
  };

  const handleIssueDateChange = (date: Date | undefined) => {
    if (!date) {
      setFormData({ ...formData, issueDate: undefined });
      return;
    }
    
    const certType = certificationTypes.find(t => t.value === formData.type);
    const newExpiryDate = certType 
      ? addDays(date, certType.defaultValidityYears * 365)
      : formData.expiryDate;
    
    setFormData({
      ...formData,
      issueDate: date,
      expiryDate: newExpiryDate,
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PDF or image file (JPG, PNG)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Please upload a file smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setDocumentFile(file);
  };

  const handleSubmit = () => {
    // Validate form
    const result = certificationSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Validate expiry date is after issue date
    if (formData.expiryDate && formData.issueDate && formData.expiryDate <= formData.issueDate) {
      setErrors({ expiryDate: 'Expiry date must be after issue date' });
      return;
    }

    setIsSubmitting(true);

    const newCertification: Certification = {
      id: certification?.id || `cert-${Date.now()}`,
      name: formData.name.trim(),
      type: formData.type,
      issueDate: formData.issueDate!.toISOString().split('T')[0],
      expiryDate: formData.expiryDate!.toISOString().split('T')[0],
      status: calculateStatus(formData.expiryDate!),
      documentId: certification?.documentId,
    };

    onSave(newCertification, documentFile || undefined);
    setIsSubmitting(false);
    onOpenChange(false);
    
    // Reset form
    setFormData({
      name: '',
      type: 'police_check',
      issueDate: undefined,
      expiryDate: undefined,
    });
    setDocumentFile(null);
    setErrors({});
  };

  const handleDelete = () => {
    if (certification && onDelete) {
      onDelete(certification.id);
      onOpenChange(false);
    }
  };

  const previewStatus = formData.expiryDate ? calculateStatus(formData.expiryDate) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Certification' : 'Add Certification'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the certification details and upload a new document if needed.'
              : 'Add a new compliance certification with document upload.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Certification Type */}
          <div className="space-y-2">
            <Label htmlFor="cert-type">Certification Type *</Label>
            <Select value={formData.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {certificationTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="cert-name">Certificate Name *</Label>
            <Input
              id="cert-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., National Police Certificate"
              maxLength={100}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Issue Date */}
          <div className="space-y-2">
            <Label>Issue Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.issueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.issueDate ? format(formData.issueDate, "PPP") : "Select issue date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.issueDate}
                  onSelect={handleIssueDateChange}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {errors.issueDate && <p className="text-xs text-destructive">{errors.issueDate}</p>}
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label>Expiry Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.expiryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.expiryDate ? format(formData.expiryDate, "PPP") : "Select expiry date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.expiryDate}
                  onSelect={(date) => setFormData({ ...formData, expiryDate: date })}
                  disabled={(date) => formData.issueDate ? date <= formData.issueDate : false}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {errors.expiryDate && <p className="text-xs text-destructive">{errors.expiryDate}</p>}
            
            {/* Status Preview */}
            {previewStatus && (
              <div className={cn(
                "flex items-center gap-2 text-xs p-2 rounded-md",
                previewStatus === 'expired' && "bg-destructive/10 text-destructive",
                previewStatus === 'expiring' && "bg-warning/10 text-warning",
                previewStatus === 'compliant' && "bg-success/10 text-success"
              )}>
                {getStatusIcon(previewStatus)}
                <span>
                  {previewStatus === 'expired' && 'This certificate has expired'}
                  {previewStatus === 'expiring' && `Expires in ${differenceInDays(formData.expiryDate!, new Date())} days`}
                  {previewStatus === 'compliant' && `Valid for ${differenceInDays(formData.expiryDate!, new Date())} days`}
                </span>
              </div>
            )}
          </div>

          {/* Document Upload */}
          <div className="space-y-2">
            <Label>Supporting Document</Label>
            <div className="border-2 border-dashed border-muted rounded-lg p-4">
              {documentFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate max-w-[200px]">{documentFile.name}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => setDocumentFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload certificate document
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Accepted formats: PDF, JPG, PNG (max 10MB)
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isEditing && onDelete && (
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              className="w-full sm:w-auto"
            >
              Delete
            </Button>
          )}
          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="flex-1 sm:flex-none gradient-primary"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add Certification'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}