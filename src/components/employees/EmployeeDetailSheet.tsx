import { useState, useRef, useEffect, useMemo } from 'react';
import { User, Mail, Phone, Calendar, Briefcase, Shield, FileText, Clock, Edit2, Save, X, Plus, AlertTriangle, CheckCircle, Pencil, AlertCircle, FileSignature } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { CertificationDialog } from '@/components/employees/CertificationDialog';
import { CreateContractDialog } from '@/components/contracts/CreateContractDialog';
import { ContractSigningDialog } from '@/components/contracts/ContractSigningDialog';
import { ContractViewSheet } from '@/components/contracts/ContractViewSheet';
import { Employee, EmploymentType, Document, Certification, ComplianceStatus } from '@/types/hrms';
import type { AwardClassification } from '@/hooks/useSettings';
import { format, differenceInDays, isValid, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useComplianceRules, useDocumentTypes } from '@/hooks/useDocuments';
import { useContracts } from '@/hooks/useContracts';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import type { Contract, ContractAuditLog, Signature } from '@/types/contracts';

interface EmployeeDetailSheetProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (updatedEmployee: Employee) => void;
  awardClassifications?: AwardClassification[];
  notesRefreshKey?: number;
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

const contractStatusLabels: Record<Contract['status'], string> = {
  draft: 'Draft',
  pending_signature: 'Pending Signature',
  signed: 'Signed',
  expired: 'Expired',
  voided: 'Voided',
};

const contractStatusClasses: Record<Contract['status'], string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_signature: 'bg-warning/10 text-warning',
  signed: 'bg-success/10 text-success',
  expired: 'bg-destructive/10 text-destructive',
  voided: 'bg-muted text-muted-foreground',
};

export function EmployeeDetailSheet({
  employee,
  open,
  onOpenChange,
  onUpdate,
  awardClassifications = [],
  notesRefreshKey = 0,
  onUploadDocument,
}: EmployeeDetailSheetProps) {
  const NO_AWARD_VALUE = '__none__';
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Employee>>({});
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { rules: complianceRules, loading: complianceRulesLoading } = useComplianceRules();
  const { documentTypes, loading: documentTypesLoading } = useDocumentTypes(undefined, {
    category: 'Document',
  });
  const [complianceDocs, setComplianceDocs] = useState<Array<{
    id: string;
    document_type_id: string;
    status: string;
    issue_date: string | null;
    expiry_date: string | null;
    file_url: string | null;
    file_name: string;
    created_at: string;
    document_type?: { name: string | null; category?: string | null; is_required?: boolean | null };
  }>>([]);
  const [complianceDocsLoading, setComplianceDocsLoading] = useState(false);
  const [addRequirementDialogOpen, setAddRequirementDialogOpen] = useState(false);
  const [selectedRequirementId, setSelectedRequirementId] = useState<string>('');
  const [employeeNotes, setEmployeeNotes] = useState<Array<{
    id: string;
    interaction_type: string;
    reason: string;
    discussion: string;
    outcome: string | null;
    logged_by_user_id: string;
    created_at: string;
  }>>([]);
  const [employeeNotesLoading, setEmployeeNotesLoading] = useState(false);
  const [noteAuthors, setNoteAuthors] = useState<Record<string, string>>({});
  const [createContractOpen, setCreateContractOpen] = useState(false);
  const [signingDialogOpen, setSigningDialogOpen] = useState(false);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedSignature, setSelectedSignature] = useState<Signature | null>(null);
  const [selectedAuditLogs, setSelectedAuditLogs] = useState<ContractAuditLog[]>([]);

  const { contracts, createContract, signContract, getSignature, getAuditLogs, logAuditEvent } = useContracts();
  const { isAdmin, isManager } = useUserRole();
  const canManageContracts = !!(isAdmin || isManager);
  const employeeContracts = useMemo(() => {
    if (!employee?.email) return [];
    const email = employee.email.toLowerCase();
    return contracts.filter((contract) => contract.employee_email?.toLowerCase() === email);
  }, [contracts, employee?.email]);

  const handleViewContract = async (contract: Contract) => {
    setSelectedContract(contract);
    setViewSheetOpen(true);

    try {
      const [signature, logs] = await Promise.all([
        getSignature(contract.id),
        getAuditLogs(contract.id),
      ]);
      setSelectedSignature(signature);
      setSelectedAuditLogs(logs);
      await logAuditEvent(contract.id, 'viewed');
    } catch (error) {
      console.error('Failed to load contract details:', error);
    }
  };

  const handleSignContract = (contract: Contract) => {
    setSelectedContract(contract);
    setSigningDialogOpen(true);
  };

  useEffect(() => {
    if (!employee) return;
    let isActive = true;

    const fetchComplianceDocs = async () => {
      try {
        setComplianceDocsLoading(true);
        const { data, error } = await supabase
          .from('employee_documents')
          .select('id,document_type_id,status,issue_date,expiry_date,file_url,file_name,created_at,document_type:document_types(name,category,is_required)')
          .eq('user_id', employee.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Failed to load compliance documents:', error);
          if (isActive) setComplianceDocs([]);
          return;
        }

        if (isActive) setComplianceDocs(data || []);
      } finally {
        if (isActive) setComplianceDocsLoading(false);
      }
    };

    fetchComplianceDocs();
    return () => {
      isActive = false;
    };
  }, [employee]);

  useEffect(() => {
    if (!employee) {
      setEmployeeNotes([]);
      setNoteAuthors({});
      return;
    }

    let isActive = true;
    const fetchNotes = async () => {
      setEmployeeNotesLoading(true);
      const { data, error } = await supabase
        .from('employee_interaction_notes')
        .select('id,interaction_type,reason,discussion,outcome,logged_by_user_id,created_at')
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false });

      if (!isActive) return;
      if (error) {
        console.error('Failed to load employee notes:', error);
        setEmployeeNotes([]);
        setNoteAuthors({});
        setEmployeeNotesLoading(false);
        return;
      }

      const notes = data || [];
      setEmployeeNotes(notes);

      const authorIds = Array.from(
        new Set(notes.map((note) => note.logged_by_user_id).filter(Boolean))
      );

      if (authorIds.length === 0) {
        setNoteAuthors({});
        setEmployeeNotesLoading(false);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id,display_name')
        .in('id', authorIds);

      if (!isActive) return;
      if (profilesError) {
        console.error('Failed to load note authors:', profilesError);
        setNoteAuthors({});
      } else {
        const authorMap: Record<string, string> = {};
        (profilesData || []).forEach((profile) => {
          if (profile.id) {
            authorMap[profile.id] = profile.display_name || profile.id;
          }
        });
        setNoteAuthors(authorMap);
      }
      setEmployeeNotesLoading(false);
    };

    fetchNotes();
    return () => {
      isActive = false;
    };
  }, [employee, notesRefreshKey]);
  const requiredComplianceRules = useMemo(() => {
    if (!employee) return [];
    const roleName = employee.position?.toLowerCase() || '';
    const departmentName = employee.department || '';
    const complianceDocsOnly = complianceDocs.filter(
      (doc) => (doc.document_type?.category || 'Document') === 'Compliance',
    );
    const complianceDocTypeIds = new Set(complianceDocsOnly.map((doc) => doc.document_type_id));

    return complianceRules.filter((rule) => {
      if (!rule.is_required) return false;
      const category = rule.document_type?.category || 'Document';
      if (category !== 'Compliance') return false;
      if (rule.document_type?.is_required === false) {
        return complianceDocTypeIds.has(rule.document_type_id);
      }
      if (rule.target_type === 'all') return true;
      if (rule.target_type === 'role') {
        return (rule.target_value || '').toLowerCase() === roleName;
      }
      if (rule.target_type === 'department') {
        return rule.target_value === departmentName;
      }
      return false;
    });
  }, [complianceRules, complianceDocs, employee]);

  const requiredComplianceChecklist = useMemo(() => {
    const complianceDocsOnly = complianceDocs.filter(
      (doc) => (doc.document_type?.category || 'Document') === 'Compliance',
    );
    return requiredComplianceRules.map((rule) => {
      const match = complianceDocsOnly.find(
        (doc) => doc.document_type_id === rule.document_type_id,
      );
      return {
        rule,
        document: match || null,
      };
    });
  }, [complianceDocs, requiredComplianceRules]);

  const optionalComplianceDocs = useMemo(() => {
    const complianceDocsOnly = complianceDocs.filter(
      (doc) => (doc.document_type?.category || 'Document') === 'Compliance',
    );
    const requiredTypeIds = new Set(requiredComplianceRules.map((rule) => rule.document_type_id));
    return complianceDocsOnly.filter(
      (doc) =>
        !requiredTypeIds.has(doc.document_type_id) &&
        doc.document_type?.is_required !== true,
    );
  }, [complianceDocs, requiredComplianceRules]);

  const documentCategoryDocs = useMemo(
    () =>
      complianceDocs.filter(
        (doc) => (doc.document_type?.category || 'Document') === 'Document',
      ),
    [complianceDocs],
  );
  const documentRequirementsChecklist = useMemo(() => {
    const documentDocsOnly = complianceDocs.filter(
      (doc) => (doc.document_type?.category || 'Document') === 'Document',
    );
    return documentTypes
      .filter((docType) => (docType.category || 'Document') === 'Document')
      .filter((docType) => docType.is_required)
      .map((docType) => {
        const match = documentDocsOnly.find(
          (doc) => doc.document_type_id === docType.id,
        );
        return {
          documentType: docType,
          document: match || null,
        };
      });
  }, [complianceDocs, documentTypes]);
  const selectedRequirement = useMemo(
    () => requiredComplianceRules.find((rule) => rule.id === selectedRequirementId),
    [requiredComplianceRules, selectedRequirementId],
  );
  const selectedRequirementDoc = useMemo(() => {
    if (!selectedRequirement) return null;
    return (
      complianceDocs.find(
        (doc) =>
          doc.document_type_id === selectedRequirement.document_type_id &&
          (doc.document_type?.category || 'Document') === 'Compliance',
      ) || null
    );
  }, [complianceDocs, selectedRequirement]);

  const getRequirementStatus = (document: (typeof complianceDocs)[number] | null) => {
    if (!document) {
      return {
        type: 'missing' as const,
        label: 'No document uploaded',
        icon: Plus,
        className: 'text-muted-foreground',
      };
    }

    const status = document.status;
    const expiryDate = document.expiry_date ? new Date(document.expiry_date) : null;

    if (status === 'approved') {
      if (expiryDate && isPast(expiryDate)) {
        return {
          type: 'expired' as const,
          label: `Expired ${format(expiryDate, 'MMM d, yyyy')}`,
          icon: AlertTriangle,
          className: 'bg-destructive/10 text-destructive',
        };
      }

      if (expiryDate) {
        const days = differenceInDays(expiryDate, new Date());
        const isExpiring = days <= 30;
        return {
          type: isExpiring ? ('expiring' as const) : ('compliant' as const),
          label: `Expires ${format(expiryDate, 'MMM d, yyyy')} (${days} days)`,
          icon: Clock,
          className: isExpiring ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success',
        };
      }

      return {
        type: 'no_expiry' as const,
        label: 'Expiry date not set',
        icon: AlertCircle,
        className: 'bg-warning/10 text-warning',
      };
    }

    if (status === 'pending') {
      if (expiryDate) {
        if (isPast(expiryDate)) {
          return {
            type: 'expired' as const,
            label: `Expired ${format(expiryDate, 'MMM d, yyyy')}`,
            icon: AlertTriangle,
            className: 'bg-destructive/10 text-destructive',
          };
        }
        const days = differenceInDays(expiryDate, new Date());
        return {
          type: 'compliant' as const,
          label: `Expires ${format(expiryDate, 'MMM d, yyyy')} (${days} days)`,
          icon: CheckCircle,
          className: 'bg-success/10 text-success',
        };
      }
      return {
        type: 'no_expiry' as const,
        label: 'Expiry date not set',
        icon: AlertCircle,
        className: 'bg-warning/10 text-warning',
      };
    }

    if (status === 'rejected') {
      return {
        type: 'rejected' as const,
        label: 'Rejected',
        icon: AlertTriangle,
        className: 'bg-destructive/10 text-destructive',
      };
    }

    if (status === 'expired') {
      return {
        type: 'expired' as const,
        label: expiryDate ? `Expired ${format(expiryDate, 'MMM d, yyyy')}` : 'Expired',
        icon: AlertTriangle,
        className: 'bg-destructive/10 text-destructive',
      };
    }

    return {
      type: 'unknown' as const,
      label: 'Unknown',
      icon: AlertTriangle,
      className: 'bg-muted/50 text-muted-foreground',
    };
  };

  if (!employee) return null;

  // Helper functions for certification management
  const formatDateOrDash = (value?: string | null) => {
    if (!value) return 'Not set';
    const parsed = new Date(value);
    return isValid(parsed) ? format(parsed, 'MMM d, yyyy') : 'Not set';
  };

  const formatDateTimeOrDash = (value?: string | null) => {
    if (!value) return 'Not set';
    const parsed = new Date(value);
    return isValid(parsed) ? format(parsed, 'MMM d, yyyy h:mm a') : 'Not set';
  };

  const getStatusIcon = (status: ComplianceStatus | 'no_expiry') => {
    switch (status) {
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'expiring':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'no_expiry':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
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
        const { data } = await supabase
          .from('employee_documents')
          .select('id,document_type_id,status,issue_date,expiry_date,file_url,file_name,created_at,document_type:document_types(name,category,is_required)')
          .eq('user_id', employee.id)
          .order('created_at', { ascending: false });
        setComplianceDocs(data || []);
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

  const handleOpenRequirementDialog = (ruleId?: string) => {
    if (requiredComplianceRules.length === 0) {
      toast({
        title: 'No requirements',
        description: 'No compliance requirements are assigned to this role.',
        variant: 'destructive',
      });
      return;
    }
    setSelectedRequirementId(ruleId || requiredComplianceRules[0].id);
    setAddRequirementDialogOpen(true);
  };

  const uploadRequirementDocument = async (
    file: File,
    documentTypeId: string,
    issueDate?: string,
    expiryDate?: string
  ) => {
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
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      let organisationId: string | null = null;

      if (userId) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('organisation_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (profileError) {
          console.error('Failed to resolve organisation for upload:', profileError);
        } else {
          organisationId = profileData?.organisation_id ?? null;
        }
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `employees/${employee.id}/compliance/${documentTypeId}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('employee-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('employee-documents')
        .getPublicUrl(filePath);
      const fileUrl = data.publicUrl;

      const baseInsertPayload = {
        user_id: employee.id,
        document_type_id: documentTypeId,
        file_url: fileUrl,
        file_name: file.name,
        issue_date: issueDate || null,
        expiry_date: expiryDate || null,
        status: 'pending',
      };

      const insertPayload = organisationId
        ? { ...baseInsertPayload, organisation_id: organisationId }
        : baseInsertPayload;

      const { error: insertError } = await supabase
        .from('employee_documents')
        .insert(insertPayload as any);

      if (insertError && insertError.message?.includes('organisation_id')) {
        const { error: retryError } = await supabase
          .from('employee_documents')
          .insert(baseInsertPayload as any);
        if (retryError) throw retryError;
      } else if (insertError) {
        throw insertError;
      }

      const { data: refreshed } = await supabase
        .from('employee_documents')
        .select('id,document_type_id,status,issue_date,expiry_date,file_url,file_name,created_at,document_type:document_types(name,category,is_required)')
        .eq('user_id', employee.id)
        .order('created_at', { ascending: false });

      setComplianceDocs(refreshed || []);
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
    }
  };


  const handleRequirementDialogSubmit = async (payload: {
    requirementId: string;
    issueDate: string;
    expiryDate: string;
    documentFile?: File;
  }) => {
    const rule = requiredComplianceRules.find((r) => r.id === payload.requirementId);
    if (!rule || !payload.documentFile) return;
    await uploadRequirementDocument(
      payload.documentFile,
      rule.document_type_id,
      payload.issueDate,
      payload.expiryDate
    );
    setAddRequirementDialogOpen(false);
    setSelectedRequirementId('');
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

  // Calculate compliance percentage based on required compliance docs (missing + expired count as non-compliant)
  const totalRequirements = requiredComplianceChecklist.length;
  const missingOrExpiredCount = requiredComplianceChecklist.filter((item) => {
    if (!item.document) return true;
    const status = getRequirementStatus(item.document);
    return status.type === 'expired';
  }).length;
  const compliancePercentage =
    totalRequirements > 0
      ? Math.round(((totalRequirements - missingOrExpiredCount) / totalRequirements) * 100)
      : 0;

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
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setAvatarFile(null);
  };

  const uploadAvatar = async (file: File) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `employees/${employee.id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from('employee-avatars')
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('employee-avatars').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!editData.firstName || !editData.lastName || !editData.email) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    let avatarUrl = employee.avatar;
    if (avatarFile) {
      try {
        avatarUrl = await uploadAvatar(avatarFile);
      } catch (err: any) {
        toast({
          title: 'Upload failed',
          description: err?.message || 'Unable to upload profile photo.',
          variant: 'destructive',
        });
        return;
      }
    }

    const updatedEmployee: Employee = {
      ...employee,
      ...editData,
      avatar: avatarUrl,
    } as Employee;

    onUpdate?.(updatedEmployee);
    setIsEditing(false);
    setEditData({});
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setAvatarFile(null);
    
    toast({
      title: 'Profile Updated',
      description: `${updatedEmployee.firstName} ${updatedEmployee.lastName}'s profile has been updated.`,
    });
  };

  const handleSheetClose = (openState: boolean) => {
    if (!openState) {
      setIsEditing(false);
      setEditData({});
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview(null);
      setAvatarFile(null);
    }
    onOpenChange(openState);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload an image file.',
        variant: 'destructive',
      });
      return;
    }

    const maxSize = 7 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Please upload a file smaller than 7MB.',
        variant: 'destructive',
      });
      return;
    }

    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  return (
    <Sheet open={open} onOpenChange={handleSheetClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
        <SheetHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 avatar-ring">
              <AvatarImage
                src={isEditing ? avatarPreview || employee.avatar : employee.avatar}
                alt={`${employee.firstName} ${employee.lastName}`}
              />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                {(isEditing ? editData.firstName?.[0] : employee.firstName[0]) || 'E'}
                {(isEditing ? editData.lastName?.[0] : employee.lastName[0]) || 'E'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                    {avatarPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                          setAvatarPreview(null);
                          setAvatarFile(null);
                          if (avatarInputRef.current) avatarInputRef.current.value = '';
                        }}
                      >
                        Remove
                      </Button>
                    )}
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
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
                      value={editData.awardClassification ?? NO_AWARD_VALUE}
                      onValueChange={(value) =>
                        setEditData({
                          ...editData,
                          awardClassification: value === NO_AWARD_VALUE ? undefined : value,
                        })
                      }
                    >
                      <SelectTrigger id="edit-award">
                        <SelectValue placeholder="Select award classification" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value={NO_AWARD_VALUE}>Not set</SelectItem>
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

                  {/* Requirements Section */}
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground font-medium">Requirements</p>
                    </div>
                    
                  {complianceRulesLoading || complianceDocsLoading ? (
                    <div className="text-xs text-muted-foreground">Loading requirements...</div>
                  ) : requiredComplianceChecklist.length > 0 ? (
                    <div className="space-y-2">
                      {requiredComplianceChecklist.map((item) => {
                          const status = getRequirementStatus(item.document);
                          const statusForIcon: ComplianceStatus | 'no_expiry' =
                            status.type === 'expired' || status.type === 'rejected'
                              ? 'expired'
                              : status.type === 'expiring'
                              ? 'expiring'
                              : status.type === 'no_expiry'
                              ? 'no_expiry'
                              : status.type === 'missing'
                              ? 'pending'
                              : 'compliant';
                          const hasDocument = Boolean(item.document);
                          return (
                            <div 
                              key={item.rule.id} 
                              className={cn(
                                "p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                                status.type === 'expired' && "border-destructive/50 bg-destructive/5",
                                status.type === 'expiring' && "border-warning/50 bg-warning/5",
                                status.type === 'compliant' && "border-success/50 bg-success/5",
                                status.type === 'rejected' && "border-destructive/50 bg-destructive/5",
                                status.type === 'missing' && "border-muted",
                                status.type === 'no_expiry' && "border-warning/50 bg-warning/5"
                              )}
                              onClick={() => handleOpenRequirementDialog(item.rule.id)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  {getStatusIcon(statusForIcon)}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{item.rule.document_type?.name || 'Unknown document'}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {status.label}
                                    </p>
                                  </div>
                                </div>
                                {hasDocument ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenRequirementDialog(item.rule.id);
                                    }}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenRequirementDialog(item.rule.id);
                                    }}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 border-2 border-dashed border-muted rounded-lg">
                        <Shield className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">No Requirements added</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenRequirementDialog()}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Requirement
                        </Button>
                      </div>
                    )}
                  </div>

                  {optionalComplianceDocs.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <p className="text-xs text-muted-foreground font-medium">Additional Compliance Files</p>
                      <div className="space-y-2">
                        {optionalComplianceDocs.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between text-sm p-3 rounded-lg border bg-muted/30">
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {doc.document_type?.name || doc.file_name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Uploaded {formatDateOrDash(doc.created_at)}
                              </p>
                            </div>
                            {doc.file_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(doc.file_url, '_blank', 'noopener,noreferrer');
                                }}
                              >
                                View
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Documents */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Documents
                    </h3>
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
                  {documentTypesLoading ? (
                    <div className="text-xs text-muted-foreground">Loading requirements...</div>
                  ) : documentRequirementsChecklist.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {documentRequirementsChecklist.map((item) => {
                        const hasDocument = Boolean(item.document);
                        const displayDate = item.document?.issue_date || item.document?.created_at || null;
                        return (
                          <div
                            key={item.documentType.id}
                            className={cn(
                              "p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                              hasDocument ? "border-muted" : "border-muted"
                            )}
                            onClick={() => {
                              const rule = requiredComplianceRules.find(
                                (r) => r.document_type_id === item.documentType.id,
                              );
                              if (rule) {
                                handleOpenRequirementDialog(rule.id);
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {item.documentType.name || 'Unknown document'}
                                  </p>
                                  {hasDocument && displayDate ? (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {formatDateOrDash(displayDate)}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                              {hasDocument ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (item.document?.file_url) {
                                      window.open(item.document.file_url, '_blank', 'noopener,noreferrer');
                                    }
                                  }}
                                >
                                  View
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rule = requiredComplianceRules.find(
                                      (r) => r.document_type_id === item.documentType.id,
                                    );
                                    if (rule) {
                                      handleOpenRequirementDialog(rule.id);
                                    }
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Document
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {documentCategoryDocs.length > 0 && (
                    <div className="space-y-2">
                      {documentCategoryDocs.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{doc.file_name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                              {formatDateOrDash(doc.created_at)}
                            </span>
                            {doc.file_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(doc.file_url || '', '_blank', 'noopener,noreferrer');
                                }}
                              >
                                View
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
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

                <Separator />

                {/* Contracts */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <FileSignature className="h-4 w-4" />
                      Contracts
                    </h3>
                    {canManageContracts && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCreateContractOpen(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Create Contract
                      </Button>
                    )}
                  </div>
                  {employeeContracts.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No contracts have been created for this employee yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {employeeContracts.map((contract) => (
                        <div
                          key={contract.id}
                          className="flex items-center justify-between gap-3 rounded-lg border p-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{contract.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Created {formatDateOrDash(contract.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={`text-xs ${contractStatusClasses[contract.status]}`}>
                              {contractStatusLabels[contract.status]}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewContract(contract)}
                            >
                              View
                            </Button>
                            {contract.status === 'pending_signature' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSignContract(contract)}
                              >
                                Sign
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes
                  </h3>
                  {employeeNotesLoading ? (
                    <div className="text-xs text-muted-foreground">Loading notes...</div>
                  ) : employeeNotes.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No notes logged.</div>
                  ) : (
                    <div className="space-y-3">
                      {employeeNotes.map((note) => (
                        <div key={note.id} className="rounded-lg border p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {note.interaction_type === 'call'
                                    ? 'Phone call'
                                    : note.interaction_type === 'text'
                                    ? 'Text message'
                                    : note.interaction_type === 'email'
                                    ? 'Email'
                                    : 'Note'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDateTimeOrDash(note.created_at)}
                                </span>
                              </div>
                              <p className="text-sm font-medium mt-1">{note.reason}</p>
                              <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                                {note.discussion}
                              </p>
                              {note.outcome ? (
                                <p className="text-xs text-muted-foreground mt-2">
                                  <span className="font-medium text-foreground">Outcome:</span>{' '}
                                  {note.outcome}
                                </p>
                              ) : null}
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                              Logged by{' '}
                              {noteAuthors[note.logged_by_user_id] ||
                                note.logged_by_user_id ||
                                'Unknown'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
          ) : null}
        </div>
      </SheetContent>

      <CertificationDialog
        open={addRequirementDialogOpen}
        onOpenChange={setAddRequirementDialogOpen}
        mode="requirement"
        requirementOptions={requiredComplianceRules.map((rule) => ({
          id: rule.id,
          name: rule.document_type?.name || 'Unknown document',
        }))}
        selectedRequirementId={selectedRequirementId}
        onRequirementChange={setSelectedRequirementId}
        requirementName={selectedRequirement?.document_type?.name || 'Requirement'}
        requirementHasDocument={Boolean(selectedRequirementDoc)}
        requirementIssueDate={selectedRequirementDoc?.issue_date || null}
        requirementExpiryDate={selectedRequirementDoc?.expiry_date || null}
        requirementDocumentName={selectedRequirementDoc?.file_name || null}
        requirementDocumentUrl={selectedRequirementDoc?.file_url || null}
        onSaveRequirement={handleRequirementDialogSubmit}
      />

      <CreateContractDialog
        open={createContractOpen}
        onOpenChange={setCreateContractOpen}
        initialValues={{
          employee_name: employee ? `${employee.firstName} ${employee.lastName}`.trim() : '',
          employee_email: employee?.email || '',
          position: employee?.position || '',
          department: employee?.department || '',
          employment_type: employee?.employmentType || 'casual',
          start_date: employee?.startDate || '',
          pay_rate: employee?.payRate ? employee.payRate.toFixed(2) : '',
        }}
        onCreate={async (contract) => {
          if (!canManageContracts) {
            toast({
              title: 'Access restricted',
              description: 'You do not have permission to create contracts.',
              variant: 'destructive',
            });
            return;
          }
          await createContract(contract);
        }}
      />

      <ContractSigningDialog
        open={signingDialogOpen}
        onOpenChange={setSigningDialogOpen}
        contract={selectedContract}
        onSign={async (contractId, signatureData, signatureType) => {
          if (!selectedContract) return;
          await signContract(
            contractId,
            signatureData,
            signatureType,
            selectedContract.employee_name,
            selectedContract.employee_email
          );
        }}
      />

      <ContractViewSheet
        open={viewSheetOpen}
        onOpenChange={setViewSheetOpen}
        contract={selectedContract}
        signature={selectedSignature}
        auditLogs={selectedAuditLogs}
      />
    </Sheet>
  );
}
