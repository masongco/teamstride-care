import { useState, useRef } from 'react';
import { User, Mail, Phone, Calendar, Briefcase, Shield, FileText, Clock, Edit2, Save, X, Upload, Plus, AlertTriangle, CheckCircle, Pencil } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadge } from '@/components/ui/status-badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Employee, EmploymentType, Document, Certification, ComplianceStatus } from '@/types/hrms';
import type { AwardClassification } from '@/hooks/useSettings';
import { format, differenceInDays, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { CertificationDialog } from './CertificationDialog';

interface EmployeeDetailSheetProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (updatedEmployee: Employee) => void;
  awardClassifications?: AwardClassification[];
  onSaveCertification?: (
    certification: Certification,
    documentFile: File | undefined,
    overallStatus: ComplianceStatus
  ) => void | Promise<void>;
  onDeleteCertification?: (
    certificationId: string,
    overallStatus: ComplianceStatus
  ) => void | Promise<void>;
  onUploadDocument?: (file: File) => void | Promise<void>;
}

const employmentTypeLabels: Record<EmploymentType, string> = {
  casual: 'Casual',
  part_time: 'Part-Time',
  full_time: 'Full-Time',
  contractor: 'Contractor',
};

const employmentTypeColors: Record<EmploymentType, string> = {
  casual: 'bg-info/10 text-info',
  part_time: 'bg-primary/10 text-primary',
  full_time: 'bg-success/10 text-success',
  contractor: 'bg-warning/10 text-warning',
};

export function EmployeeDetailSheet({
  employee,
  open,
  onOpenChange,
  onUpdate,
  awardClassifications = [],
  onSaveCertification,
  onDeleteCertification,
  onUploadDocument,
}: EmployeeDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Employee>>({});
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!employee) return null;

  // Helper functions for certification management
  const formatDateOrDash = (value?: string | null) => {
    if (!value) return 'Not set';
    const parsed = new Date(value);
    return isValid(parsed) ? format(parsed, 'MMM d, yyyy') : 'Not set';
  };

  const getExpiryInfo = (expiryDate?: string | null) => {
    if (!expiryDate) return { daysUntil: null, expiry: null };
    const expiry = new Date(expiryDate);
    if (!isValid(expiry)) return { daysUntil: null, expiry: null };
    const today = new Date();
    const daysUntil = differenceInDays(expiry, today);
    return { daysUntil, expiry };
  };

  const getStatusIcon = (status: ComplianceStatus) => {
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
  };

  const handleAddCertification = () => {
    setSelectedCertification(null);
    setCertDialogOpen(true);
  };

  const handleEditCertification = (cert: Certification) => {
    setSelectedCertification(cert);
    setCertDialogOpen(true);
  };

  const handleSaveCertification = async (certification: Certification, documentFile?: File) => {
    let newDocuments = [...employee.documents];
    
    // If a document file was provided, add it to the documents list
    if (documentFile) {
      const newDocument: Document = {
        id: `doc-${Date.now()}`,
        name: documentFile.name,
        type: 'certificate',
        uploadedAt: new Date().toISOString(),
        url: URL.createObjectURL(documentFile),
      };
      newDocuments = [...newDocuments, newDocument];
      certification.documentId = newDocument.id;
    }

    // Update or add certification
    const existingIndex = employee.certifications.findIndex(c => c.id === certification.id);
    let newCertifications: Certification[];
    
    if (existingIndex >= 0) {
      newCertifications = [...employee.certifications];
      newCertifications[existingIndex] = certification;
    } else {
      newCertifications = [...employee.certifications, certification];
    }

    // Recalculate overall compliance status
    const hasExpired = newCertifications.some(c => c.status === 'expired');
    const hasExpiring = newCertifications.some(c => c.status === 'expiring');
    const hasPending = newCertifications.some(c => c.status === 'pending');
    
    let overallStatus: ComplianceStatus = 'compliant';
    if (hasExpired) overallStatus = 'expired';
    else if (hasExpiring) overallStatus = 'expiring';
    else if (hasPending) overallStatus = 'pending';

    if (onSaveCertification) {
      await onSaveCertification(certification, documentFile, overallStatus);
      return;
    }

    const updatedEmployee: Employee = {
      ...employee,
      certifications: newCertifications,
      documents: newDocuments,
      complianceStatus: overallStatus,
    };

    onUpdate?.(updatedEmployee);

    toast({
      title: existingIndex >= 0 ? 'Certification Updated' : 'Certification Added',
      description: `${certification.name} has been ${existingIndex >= 0 ? 'updated' : 'added'} successfully.`,
    });
  };

  const handleDeleteCertification = async (certificationId: string) => {
    const newCertifications = employee.certifications.filter(c => c.id !== certificationId);
    
    // Recalculate overall compliance status
    const hasExpired = newCertifications.some(c => c.status === 'expired');
    const hasExpiring = newCertifications.some(c => c.status === 'expiring');
    const hasPending = newCertifications.some(c => c.status === 'pending');
    
    let overallStatus: ComplianceStatus = 'compliant';
    if (hasExpired) overallStatus = 'expired';
    else if (hasExpiring) overallStatus = 'expiring';
    else if (hasPending) overallStatus = 'pending';

    const finalStatus = newCertifications.length === 0 ? 'pending' : overallStatus;

    if (onDeleteCertification) {
      await onDeleteCertification(certificationId, finalStatus);
      return;
    }

    const updatedEmployee: Employee = {
      ...employee,
      certifications: newCertifications,
      complianceStatus: finalStatus,
    };

    onUpdate?.(updatedEmployee);

    toast({
      title: 'Certification Removed',
      description: 'The certification has been removed.',
    });
  };

  const handleDocumentUpload = async (
    eventOrFile: React.ChangeEvent<HTMLInputElement> | File
  ) => {
    const file =
      eventOrFile instanceof File ? eventOrFile : eventOrFile.target.files?.[0];
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
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Please upload a file smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingDocument(true);

    if (onUploadDocument) {
      try {
        await onUploadDocument(file);
        toast({
          title: 'Document Uploaded',
          description: `${file.name} has been uploaded successfully.`,
        });
      } catch (err: any) {
        toast({
          title: 'Upload failed',
          description: err?.message || 'Unable to upload document.',
          variant: 'destructive',
        });
      } finally {
        setIsUploadingDocument(false);
        if (!(eventOrFile instanceof File) && fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
      return;
    }

    // Fallback to local-only behavior
    const newDocument: Document = {
      id: `doc-${Date.now()}`,
      name: file.name,
      type: 'certificate',
      uploadedAt: new Date().toISOString(),
      url: URL.createObjectURL(file),
    };

    const updatedEmployee: Employee = {
      ...employee,
      documents: [...employee.documents, newDocument],
    };

    onUpdate?.(updatedEmployee);
    setIsUploadingDocument(false);

    toast({
      title: 'Document Uploaded',
      description: `${file.name} has been uploaded successfully.`,
    });

    if (!(eventOrFile instanceof File) && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragActive) setIsDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      await handleDocumentUpload(file);
    }
  };

  // Calculate compliance percentage
  const totalCerts = employee.certifications.length;
  const validCerts = employee.certifications.filter(c => c.status === 'compliant').length;
  const compliancePercentage = totalCerts > 0 ? Math.round((validCerts / totalCerts) * 100) : 0;

  const buildEditData = (emp: Employee): Partial<Employee> => ({
    firstName: emp.firstName,
    lastName: emp.lastName,
    email: emp.email,
    phone: emp.phone,
    position: emp.position,
    department: emp.department,
    employmentType: emp.employmentType,
    payRate: emp.payRate,
    awardClassification: emp.awardClassification,
    emergencyContact: emp.emergencyContact,
  });

  const awardLabel =
    awardClassifications.find((award) => award.id === employee.awardClassification)?.name || 'Not set';

  const handleStartEdit = () => {
    setEditData(buildEditData(employee));
    setIsEditing(true);
  };


  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleSave = () => {
    if (!editData.firstName || !editData.lastName || !editData.email) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const updatedEmployee: Employee = {
      ...employee,
      ...editData,
    } as Employee;

    onUpdate?.(updatedEmployee);
    setIsEditing(false);
    setEditData({});
    
    toast({
      title: 'Profile Updated',
      description: `${updatedEmployee.firstName} ${updatedEmployee.lastName}'s profile has been updated.`,
    });
  };

  const handleSheetClose = (openState: boolean) => {
    if (!openState) {
      setIsEditing(false);
      setEditData({});
    }
    onOpenChange(openState);
  };

  return (
    <Sheet open={open} onOpenChange={handleSheetClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
        <SheetHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 avatar-ring">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                {(isEditing ? editData.firstName?.[0] : employee.firstName[0]) || 'E'}
                {(isEditing ? editData.lastName?.[0] : employee.lastName[0]) || 'E'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={editData.firstName || ''}
                      onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                      placeholder="First Name"
                      className="h-8"
                    />
                    <Input
                      value={editData.lastName || ''}
                      onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                      placeholder="Last Name"
                      className="h-8"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <SheetTitle className="text-xl">
                    {employee.firstName} {employee.lastName}
                  </SheetTitle>
                  <SheetDescription className="flex items-center gap-2 mt-1">
                    {employee.position}
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        employmentTypeColors[employee.employmentType]
                      )}
                    >
                      {employmentTypeLabels[employee.employmentType]}
                    </span>
                  </SheetDescription>
                </>
              )}
            </div>
            {!isEditing && (
              <Button variant="outline" size="icon" onClick={handleStartEdit}>
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact Information
              </h3>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editData.email || ''}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input
                      id="edit-phone"
                      value={editData.phone || ''}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${employee.email}`} className="text-primary hover:underline">
                      {employee.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${employee.phone}`} className="hover:underline">
                      {employee.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Employment Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Employment Details
              </h3>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="edit-position">Position</Label>
                      <Input
                        id="edit-position"
                        value={editData.position || ''}
                        onChange={(e) => setEditData({ ...editData, position: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-department">Department</Label>
                      <Input
                        id="edit-department"
                        value={editData.department || ''}
                        onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="edit-employmentType">Employment Type</Label>
                      <Select
                        value={editData.employmentType}
                        onValueChange={(v) => setEditData({ ...editData, employmentType: v as EmploymentType })}
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
                      <Label htmlFor="edit-payRate">Pay Rate ($/hr)</Label>
                      <Input
                        id="edit-payRate"
                        type="number"
                        step="0.01"
                        value={editData.payRate || ''}
                        onChange={(e) => setEditData({ ...editData, payRate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-award">Award Classification</Label>
                    <Select
                      value={editData.awardClassification || ''}
                      onValueChange={(value) =>
                        setEditData({ ...editData, awardClassification: value || undefined })
                      }
                    >
                      <SelectTrigger id="edit-award">
                        <SelectValue placeholder="Select award classification" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="">Not set</SelectItem>
                        {awardClassifications.map((award) => (
                          <SelectItem key={award.id} value={award.id}>
                            {award.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Department</p>
                    <p className="font-medium">{employee.department}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Start Date</p>
                    <p className="font-medium">{formatDateOrDash(employee.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pay Rate</p>
                    <p className="font-medium">${employee.payRate.toFixed(2)}/hr</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Award Classification</p>
                    <p className="font-medium">{awardLabel}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant={employee.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                      {employee.status}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Emergency Contact - Only in Edit Mode */}
            {isEditing && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Emergency Contact
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="edit-emergency-name">Contact Name</Label>
                      <Input
                        id="edit-emergency-name"
                        value={editData.emergencyContact?.name || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          emergencyContact: {
                            ...editData.emergencyContact,
                            name: e.target.value,
                            phone: editData.emergencyContact?.phone || '',
                            relationship: editData.emergencyContact?.relationship || '',
                          }
                        })}
                        placeholder="Emergency contact name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="edit-emergency-phone">Phone</Label>
                        <Input
                          id="edit-emergency-phone"
                          value={editData.emergencyContact?.phone || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            emergencyContact: {
                              ...editData.emergencyContact,
                              name: editData.emergencyContact?.name || '',
                              phone: e.target.value,
                              relationship: editData.emergencyContact?.relationship || '',
                            }
                          })}
                          placeholder="Phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-emergency-relationship">Relationship</Label>
                        <Input
                          id="edit-emergency-relationship"
                          value={editData.emergencyContact?.relationship || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            emergencyContact: {
                              ...editData.emergencyContact,
                              name: editData.emergencyContact?.name || '',
                              phone: editData.emergencyContact?.phone || '',
                              relationship: e.target.value,
                            }
                          })}
                          placeholder="e.g., Spouse, Parent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!isEditing && (
              <>
                <Separator />

                {/* Compliance Status */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Compliance Status
                    </h3>
                    <StatusBadge status={employee.complianceStatus} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Overall Compliance</span>
                      <span className="font-medium">{compliancePercentage}%</span>
                    </div>
                    <Progress value={compliancePercentage} className="h-2" />
                  </div>
                  
                  {/* Certifications Section */}
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground font-medium">Certifications</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAddCertification}
                        className="h-7 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                    
                    {employee.certifications.length > 0 ? (
                      <div className="space-y-2">
                        {employee.certifications.map((cert) => {
                          const { daysUntil, expiry } = getExpiryInfo(cert.expiryDate);
                          return (
                            <div 
                              key={cert.id} 
                              className={cn(
                                "p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                                cert.status === 'expired' && "border-destructive/50 bg-destructive/5",
                                cert.status === 'expiring' && "border-warning/50 bg-warning/5",
                                cert.status === 'compliant' && "border-success/50 bg-success/5",
                                cert.status === 'pending' && "border-muted"
                              )}
                              onClick={() => handleEditCertification(cert)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  {getStatusIcon(cert.status)}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{cert.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {cert.status === 'pending' ? (
                                        'Awaiting documentation'
                                      ) : !expiry ? (
                                        'Expiry date not set'
                                      ) : cert.status === 'expired' ? (
                                        `Expired ${format(expiry, 'MMM d, yyyy')}`
                                      ) : (
                                        `Expires ${format(expiry, 'MMM d, yyyy')} (${daysUntil} days)`
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditCertification(cert);
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 border-2 border-dashed border-muted rounded-lg">
                        <Shield className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">No certifications added</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleAddCertification}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Certification
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Documents */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Documents ({employee.documents.length})
                    </h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleUploadClick}
                      disabled={isUploadingDocument}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      {isUploadingDocument ? 'Uploading...' : 'Upload'}
                    </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleDocumentUpload}
                  />
                </div>
                <div
                  className={cn(
                    'rounded-lg border-2 border-dashed p-3 transition-colors',
                    isDragActive ? 'border-primary bg-primary/5' : 'border-muted'
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {employee.documents.length > 0 ? (
                    <div className="space-y-2">
                      {employee.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{doc.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                              {formatDateOrDash(doc.uploadedAt)}
                            </span>
                            {doc.url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(doc.url, '_blank', 'noopener,noreferrer');
                                }}
                              >
                                View
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-muted-foreground">
                          Drag and drop a file here, or
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleUploadClick}
                          disabled={isUploadingDocument}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Document
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">No documents uploaded</p>
                      <p className="text-xs text-muted-foreground mb-3">Drag and drop a file here</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleUploadClick}
                        disabled={isUploadingDocument}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Document
                      </Button>
                    </div>
                  )}
                </div>
                </div>

                {/* Emergency Contact */}
                {employee.emergencyContact && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Emergency Contact
                      </h3>
                      <div className="text-sm space-y-1">
                        <p className="font-medium">{employee.emergencyContact.name}</p>
                        <p className="text-muted-foreground">{employee.emergencyContact.relationship}</p>
                        <p>{employee.emergencyContact.phone}</p>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
          {isEditing ? (
            <>
              <Button variant="outline" className="flex-1" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button className="flex-1 gradient-primary" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="flex-1" onClick={handleStartEdit}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" className="flex-1">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </>
          )}
        </div>
      </SheetContent>

      {/* Certification Dialog */}
      <CertificationDialog
        open={certDialogOpen}
        onOpenChange={setCertDialogOpen}
        certification={selectedCertification}
        onSave={handleSaveCertification}
        onDelete={handleDeleteCertification}
      />
    </Sheet>
  );
}
