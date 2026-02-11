import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Plus,
  MoreHorizontal,
  Mail,
  Phone,
  Download,
  Upload,
  UserX,
  Loader2,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { EmploymentType, ComplianceStatus } from '@/types/hrms';
import { cn } from '@/lib/utils';
import { AddEmployeeDialog } from '@/components/employees/AddEmployeeDialog';
import { EmployeeDetailSheet } from '@/components/employees/EmployeeDetailSheet';
import { toast } from '@/hooks/use-toast';
import { accessDeniedMessage, friendlyErrorMessage, isAccessDeniedError } from '@/lib/errorMessages';
import { Link } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';
import { supabase } from '@/integrations/supabase/client';
import type {
  EmployeeDB,
  EmploymentTypeDB,
  EmployeeStatusDB,
  ComplianceStatusDB,
  EmployeeCertificationDB,
} from '@/types/database';
import type { Employee, Certification, Document } from '@/types/hrms';

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

function dbCertToLegacyCertification(cert: EmployeeCertificationDB): Certification {
  return {
    id: cert.id,
    name: cert.name,
    type: cert.type as Certification['type'],
    issueDate: cert.issue_date || '',
    expiryDate: cert.expiry_date || '',
    status: cert.status as ComplianceStatus,
    documentId: cert.document_id || undefined,
  };
}

function dbCertToDocument(cert: EmployeeCertificationDB): Document | null {
  if (!cert.document_id) return null;
  const nameFromPath = cert.document_id.split('/').pop() || cert.name || 'Document';
  return {
    id: cert.document_id,
    name: nameFromPath,
    type: 'certificate',
    uploadedAt: cert.issue_date || cert.created_at,
    url: cert.document_id,
  };
}

type EmployeeDocumentRow = {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  created_at: string;
};

function dbEmployeeDocToDocument(doc: EmployeeDocumentRow): Document {
  return {
    id: doc.id,
    name: doc.file_name,
    type: 'other',
    uploadedAt: doc.created_at,
    url: doc.file_url,
  };
}

// Transform database employee to legacy Employee type for compatibility with existing components
function dbToLegacyEmployee(
  emp: EmployeeDB,
  certs: EmployeeCertificationDB[],
  employeeDocs: Document[]
): Employee {
  const certDocs = certs.map(dbCertToDocument).filter((doc): doc is Document => Boolean(doc));
  const mergedDocs = [...certDocs, ...employeeDocs].filter((doc, index, arr) => {
    return arr.findIndex((d) => d.id === doc.id) === index;
  });

  return {
    id: emp.id,
    firstName: emp.first_name,
    lastName: emp.last_name,
    email: emp.email,
    phone: emp.phone || '',
    avatar: emp.avatar_url || undefined,
    employmentType: emp.employment_type as EmploymentType,
    position: emp.position || '',
    department: emp.department || '',
    startDate: emp.start_date || '',
    status: emp.status as Employee['status'],
    complianceStatus: emp.compliance_status as ComplianceStatus,
    payRate: emp.pay_rate || 0,
    awardClassification: undefined,
    emergencyContact: emp.emergency_contact_name
      ? {
          name: emp.emergency_contact_name,
          phone: emp.emergency_contact_phone || '',
          relationship: emp.emergency_contact_relationship || '',
        }
      : undefined,
    documents: mergedDocs,
    certifications: certs.map(dbCertToLegacyCertification),
  };
}

function friendlySupabaseError(err: any) {
  if (isAccessDeniedError(err)) {
    return accessDeniedMessage('this action');
  }
  return friendlyErrorMessage(err, 'You may not have permission to do that.');
}

function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/\s+/g, '_');
}

// Simple CSV parser that supports quoted fields and commas inside quotes.
// Returns an array of rows, each row is an array of string cells.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        // Escaped quote
        cell += '"';
        i++;
        continue;
      }
      if (ch === '"') {
        inQuotes = false;
        continue;
      }
      cell += ch;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ',') {
      row.push(cell);
      cell = '';
      continue;
    }

    if (ch === '\n') {
      row.push(cell);
      cell = '';
      // Ignore completely empty trailing row
      const isEmpty = row.every((c) => c.trim() === '');
      if (!isEmpty) rows.push(row);
      row = [];
      continue;
    }

    if (ch === '\r') {
      // ignore CR (Windows line endings)
      continue;
    }

    cell += ch;
  }

  // Last cell/row
  row.push(cell);
  const isEmpty = row.every((c) => c.trim() === '');
  if (!isEmpty) rows.push(row);

  return rows;
}

function toNumberOrUndefined(v: string): number | undefined {
  const trimmed = v.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

function toStringOrUndefined(v: string): string | undefined {
  const trimmed = v.trim();
  return trimmed ? trimmed : undefined;
}

export default function Employees() {
  const { user } = useAuth();
  const roles = useUserRole();

  // These names may differ in your hook. We safely coerce.
  const isManager = Boolean((roles as any)?.isManager);
  const isAdmin = Boolean((roles as any)?.isAdmin);
  const isPlatformUser = Boolean((roles as any)?.isPlatformUser); // optional, but recommended

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'az' | 'za'>('az');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const {
    employees: dbEmployees,
    certifications: dbCertifications,
    getCertificationsForEmployee,
    isLoading,
    error,
    createEmployee,
    updateEmployee,
    changeStatus,
    addCertification,
    updateCertification,
    deleteCertification,
    organisationId,
    isCreating,
  } = useSupabaseEmployees();

  // Who is allowed by your current employees RLS
  const canManageEmployees = isPlatformUser || isAdmin || isManager;

  // If you enforce org-scoped RLS, non-platform users must have an organisation_id
  const canCreateEmployee =
    canManageEmployees && (Boolean(organisationId) || isPlatformUser);

  const [employeeDocsMap, setEmployeeDocsMap] = useState<Record<string, Document[]>>({});

  const fetchEmployeeDocuments = async (employeeIds: string[]) => {
    if (employeeIds.length === 0) {
      setEmployeeDocsMap({});
      return;
    }

    const { data, error } = await supabase
      .from('employee_documents')
      .select('id,user_id,file_name,file_url,created_at')
      .in('user_id', employeeIds);

    if (error) {
      console.error('Failed to load employee documents:', error);
      return;
    }

    const map: Record<string, Document[]> = {};
    (data || []).forEach((row: EmployeeDocumentRow) => {
      if (!map[row.user_id]) map[row.user_id] = [];
      map[row.user_id].push(dbEmployeeDocToDocument(row));
    });

    setEmployeeDocsMap(map);
  };

  useEffect(() => {
    const ids = dbEmployees.map((e) => e.id);
    fetchEmployeeDocuments(ids);
  }, [dbEmployees]);

  // Convert DB employees to legacy format for UI compatibility
  const employees = useMemo(
    () =>
      dbEmployees.map((emp) =>
        dbToLegacyEmployee(emp, getCertificationsForEmployee(emp.id), employeeDocsMap[emp.id] || [])
      ),
    [dbEmployees, getCertificationsForEmployee, employeeDocsMap]
  );

  useEffect(() => {
    if (!selectedEmployee) return;
    const refreshed = employees.find((emp) => emp.id === selectedEmployee.id);
    if (refreshed && refreshed !== selectedEmployee) {
      setSelectedEmployee(refreshed);
    }
  }, [employees, selectedEmployee]);

  const filteredEmployees = useMemo(() => {
    const filtered = employees.filter((employee) => {
      // Exclude inactive/deactivated employees from the main list
      if (employee.status === 'inactive') return false;

      const normalizedQuery = searchQuery.trim().toLowerCase();
      const tokens = normalizedQuery ? normalizedQuery.split(/\s+/) : [];
      const name = `${employee.firstName} ${employee.lastName}`.toLowerCase();
      const email = (employee.email || '').toLowerCase();
      const position = (employee.position || '').toLowerCase();
      const haystack = `${name} ${email} ${position}`;

      const matchesSearch =
        tokens.length === 0 || tokens.every((token) => haystack.includes(token));

      const matchesDepartment =
        filterDepartment === 'all' || employee.department === filterDepartment;
      const matchesStatus = filterStatus === 'all' || employee.status === filterStatus;

      return matchesSearch && matchesDepartment && matchesStatus;
    });

    const direction = sortOrder === 'az' ? 1 : -1;
    const safeCompare = (a: string, b: string) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' }) * direction;

    return filtered.sort((a, b) => {
      const last = safeCompare(a.lastName || '', b.lastName || '');
      if (last !== 0) return last;
      return safeCompare(a.firstName || '', b.firstName || '');
    });
  }, [employees, searchQuery, filterDepartment, filterStatus, sortOrder]);

  const departments = useMemo(
    () => [...new Set(employees.map((e) => e.department).filter(Boolean))],
    [employees]
  );

  const handleViewProfile = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDetailSheetOpen(true);
  };

  const handleUpdateEmployee = async (updatedEmployee: Employee) => {
    // Non-platform users without org should not be able to update; platform users may.
    if (!isPlatformUser && !organisationId) {
      toast({
        title: 'No organisation',
        description: 'Create or join an organisation before editing employees.',
        variant: 'destructive',
      });
      return;
    }

    const dbEmployee = dbEmployees.find((e) => e.id === updatedEmployee.id);
    if (!dbEmployee) return;

    try {
      await updateEmployee(updatedEmployee.id, {
        first_name: updatedEmployee.firstName,
        last_name: updatedEmployee.lastName,
        email: updatedEmployee.email,
        phone: updatedEmployee.phone || null,
        position: updatedEmployee.position || null,
        department: updatedEmployee.department || null,
        employment_type: updatedEmployee.employmentType as EmploymentTypeDB,
        pay_rate: updatedEmployee.payRate || null,
        status: updatedEmployee.status as EmployeeStatusDB,
        compliance_status: updatedEmployee.complianceStatus as ComplianceStatusDB,
        emergency_contact_name: updatedEmployee.emergencyContact?.name || null,
        emergency_contact_phone: updatedEmployee.emergencyContact?.phone || null,
        emergency_contact_relationship:
          updatedEmployee.emergencyContact?.relationship || null,
        // NOTE: do NOT update organisation_id here (RLS / triggers should keep it immutable)
      });

      setSelectedEmployee(updatedEmployee);
      toast({
        title: 'Saved',
        description: 'Employee details updated.',
      });
    } catch (err: any) {
      console.error('Failed to update employee:', err);
      toast({
        title: 'Update blocked',
        description: friendlySupabaseError(err),
        variant: 'destructive',
      });
    }
  };

  const handleDeactivateEmployee = async (employee: Employee) => {
    const newStatus = employee.status === 'inactive' ? 'active' : 'inactive';

    try {
      await changeStatus(employee.id, newStatus as EmployeeStatusDB);
      toast({
        title: employee.status === 'inactive' ? 'Reactivated' : 'Deactivated',
        description: `${employee.firstName} ${employee.lastName} is now ${newStatus}.`,
      });
    } catch (err: any) {
      console.error('Failed to change status:', err);
      toast({
        title: 'Action blocked',
        description: friendlySupabaseError(err),
        variant: 'destructive',
      });
    }
  };

  const uploadCertificationDocument = async (employeeId: string, file: File) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `certifications/${employeeId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('employee-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('employee-documents').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const getDefaultDocumentTypeId = async () => {
    const { data, error } = await supabase
      .from('document_types')
      .select('id,name')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(1);

    if (error) throw error;
    const row = data?.[0];
    if (!row) throw new Error('No active document types found.');
    return row.id;
  };

  const handleUploadEmployeeDocument = async (employee: Employee, file: File) => {
    if (!canManageEmployees) {
      toast({
        title: 'Access restricted',
        description: accessDeniedMessage('employee documents'),
        variant: 'destructive',
      });
      return;
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `employees/${employee.id}/documents/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('employee-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('employee-documents').getPublicUrl(filePath);
    const fileUrl = data.publicUrl;

    const documentTypeId = await getDefaultDocumentTypeId();

    const { error: insertError } = await supabase
      .from('employee_documents')
      .insert({
        user_id: employee.id,
        document_type_id: documentTypeId,
        file_url: fileUrl,
        file_name: file.name,
        status: 'pending',
      });

    if (insertError) throw insertError;

    await fetchEmployeeDocuments([employee.id]);
  };

  const handleSaveCertification = async (
    employee: Employee,
    certification: Certification,
    documentFile: File | undefined,
    overallStatus: ComplianceStatus
  ) => {
    if (!canManageEmployees) {
      toast({
        title: 'Access restricted',
        description: accessDeniedMessage('employee certifications'),
        variant: 'destructive',
      });
      return;
    }

    if (!isPlatformUser && !organisationId) {
      toast({
        title: 'No organisation',
        description: 'Create or join an organisation before updating certifications.',
        variant: 'destructive',
      });
      return;
    }

    try {
      let documentUrl = certification.documentId || undefined;

      if (documentFile) {
        documentUrl = await uploadCertificationDocument(employee.id, documentFile);
      }

      const existing = dbCertifications.find((c) => c.id === certification.id);

      if (existing) {
        await updateCertification(existing.id, {
          name: certification.name,
          type: certification.type,
          issue_date: certification.issueDate || null,
          expiry_date: certification.expiryDate || null,
          status: certification.status as ComplianceStatusDB,
          document_id: documentUrl || null,
        });
      } else {
        await addCertification({
          organisation_id: organisationId!,
          employee_id: employee.id,
          name: certification.name,
          type: certification.type,
          issue_date: certification.issueDate || undefined,
          expiry_date: certification.expiryDate || undefined,
          status: certification.status as ComplianceStatusDB,
          document_id: documentUrl,
        });
      }

      await updateEmployee(employee.id, {
        compliance_status: overallStatus as ComplianceStatusDB,
      });
    } catch (err: any) {
      console.error('Failed to save certification:', err);
      toast({
        title: 'Save failed',
        description: friendlySupabaseError(err),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCertification = async (
    employee: Employee,
    certificationId: string,
    overallStatus: ComplianceStatus
  ) => {
    if (!canManageEmployees) {
      toast({
        title: 'Access restricted',
        description: accessDeniedMessage('employee certifications'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await deleteCertification(certificationId);
      await updateEmployee(employee.id, {
        compliance_status: overallStatus as ComplianceStatusDB,
      });
    } catch (err: any) {
      console.error('Failed to delete certification:', err);
      toast({
        title: 'Delete failed',
        description: friendlySupabaseError(err),
        variant: 'destructive',
      });
    }
  };

  const handleAddEmployee = async (newEmployee: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    position: string;
    department: string;
    employmentType: string;
    payRate: number;
    avatar?: string;
  }) => {
    if (!user) {
      toast({
        title: 'Not signed in',
        description: 'You must be signed in to add employees.',
        variant: 'destructive',
      });
      return;
    }

    if (!canManageEmployees) {
      toast({
        title: 'Access restricted',
        description: accessDeniedMessage('adding employees'),
        variant: 'destructive',
      });
      return;
    }

    if (!isPlatformUser && !organisationId) {
      toast({
        title: 'No organisation yet',
        description: 'Create your organisation first, then add employees.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // IMPORTANT:
      // Do NOT pass organisation_id from the client if your DB trigger sets it.
      // RLS will enforce that the inserted row belongs to your org anyway.
      await createEmployee({
        first_name: newEmployee.firstName,
        last_name: newEmployee.lastName,
        email: newEmployee.email,
        phone: newEmployee.phone || undefined,
        avatar_url: newEmployee.avatar || undefined,
        position: newEmployee.position || undefined,
        department: newEmployee.department || undefined,
        employment_type: newEmployee.employmentType as EmploymentTypeDB,
        pay_rate: newEmployee.payRate || undefined,
        start_date: new Date().toISOString().split('T')[0],
      });

      setAddDialogOpen(false);
      toast({
        title: 'Employee added',
        description: `${newEmployee.firstName} ${newEmployee.lastName} was created.`,
      });
    } catch (err: any) {
      console.error('Failed to add employee:', err);
      toast({
        title: 'Create blocked',
        description: friendlySupabaseError(err),
        variant: 'destructive',
      });
    }
  };

  const handleImportClick = () => {
    if (!user) {
      toast({
        title: 'Not signed in',
        description: 'You must be signed in to import employees.',
        variant: 'destructive',
      });
      return;
    }

    if (!canManageEmployees) {
      toast({
        title: 'Access restricted',
        description: accessDeniedMessage('importing employees'),
        variant: 'destructive',
      });
      return;
    }

    if (!isPlatformUser && !organisationId) {
      toast({
        title: 'No organisation yet',
        description: 'Create your organisation first, then import employees.',
        variant: 'destructive',
      });
      return;
    }

    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // reset input so choosing the same file again re-triggers onChange
    e.target.value = '';

    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload a .csv file.',
        variant: 'destructive',
      });
      return;
    }

    if (isImporting) return;

    setIsImporting(true);

    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) {
        toast({
          title: 'Empty CSV',
          description: 'The CSV must include a header row and at least one data row.',
          variant: 'destructive',
        });
        return;
      }

      const headersRaw = rows[0];
      const headers = headersRaw.map((h) => normalizeHeader(h));

      // Required columns
      const required = ['first_name', 'last_name', 'email', 'employment_type'];
      const missing = required.filter((r) => !headers.includes(r));
      if (missing.length > 0) {
        toast({
          title: 'Missing columns',
          description: `CSV is missing: ${missing.join(', ')}`,
          variant: 'destructive',
        });
        return;
      }

      // Map rows into objects
      const dataRows = rows.slice(1);
      const results: { ok: number; failed: number; errors: string[] } = {
        ok: 0,
        failed: 0,
        errors: [],
      };

      // Basic size guard
      if (dataRows.length > 500) {
        toast({
          title: 'Too many rows',
          description: 'Please import 500 employees or fewer per file.',
          variant: 'destructive',
        });
        return;
      }

      // Inform user
      toast({
        title: 'Import started',
        description: `Importing ${dataRows.length} employees...`,
      });

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const obj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          obj[h] = row[idx] ?? '';
        });

        const first_name = obj['first_name']?.trim();
        const last_name = obj['last_name']?.trim();
        const email = obj['email']?.trim();
        const employment_type = obj['employment_type']?.trim() as EmploymentTypeDB;

        if (!first_name || !last_name || !email || !employment_type) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: missing required fields`);
          continue;
        }

        try {
          await createEmployee({
            first_name,
            last_name,
            email,
            phone: toStringOrUndefined(obj['phone'] ?? ''),
            avatar_url: toStringOrUndefined(obj['avatar_url'] ?? ''),
            position: toStringOrUndefined(obj['position'] ?? ''),
            department: toStringOrUndefined(obj['department'] ?? ''),
            employment_type,
            pay_rate: toNumberOrUndefined(obj['pay_rate'] ?? ''),
            start_date: toStringOrUndefined(obj['start_date'] ?? '') ?? new Date().toISOString().split('T')[0],
            // Do NOT send organisation_id (DB trigger should attach it)
          });
          results.ok++;
        } catch (err: any) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: ${friendlySupabaseError(err)}`);
        }
      }

      const summary = `${results.ok} imported, ${results.failed} failed.`;
      toast({
        title: 'Import finished',
        description: summary,
        variant: results.failed > 0 ? 'destructive' : undefined,
      });

      if (results.failed > 0) {
        // Print first few errors to console for debugging
        console.group('CSV import errors');
        results.errors.slice(0, 25).forEach((m) => console.warn(m));
        if (results.errors.length > 25) console.warn(`...and ${results.errors.length - 25} more`);
        console.groupEnd();
      }
    } catch (err: any) {
      console.error('Import failed:', err);
      toast({
        title: 'Import failed',
        description: friendlySupabaseError(err),
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = () => {
    if (filteredEmployees.length === 0) {
      toast({
        title: 'Nothing to export',
        description: 'There are no employees to export.',
        variant: 'destructive',
      });
      return;
    }
    // RLS already limits what you can see; export only exports what you can fetch.
    // Basic CSV export in-browser:
    try {
      const rows = filteredEmployees.map((e) => ({
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        phone: e.phone,
        position: e.position,
        department: e.department,
        employmentType: e.employmentType,
        status: e.status,
        complianceStatus: e.complianceStatus,
        payRate: e.payRate,
      }));

      const headers = Object.keys(rows[0]);
      const csv = [
        headers.join(','),
        ...rows.map((r) =>
          headers
            .map((h) => {
              const v = (r as any)[h] ?? '';
              const s = String(v).replace(/"/g, '""');
              return `"${s}"`;
            })
            .join(',')
        ),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employees.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({
        title: 'Export failed',
        description: 'Unable to export employees.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive">Failed to load employees. Please try again.</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-muted-foreground mt-1">
            Manage your team members and their information.
          </p>
          {!isPlatformUser && !organisationId && (
            <p className="text-sm text-warning mt-2">
              You don&apos;t have an organisation yet. Create one before adding employees.
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {isManager && (
            <Button variant="outline" asChild>
              <Link to="/employees/deactivated">
                <UserX className="h-4 w-4 mr-2" />
                Deactivated
              </Link>
            </Button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />

          <Button
            variant="outline"
            onClick={handleImportClick}
            disabled={!canCreateEmployee || isImporting}
            title={!canCreateEmployee ? accessDeniedMessage('creating employees') : undefined}
          >
            <Download className="h-4 w-4 mr-2" />
            {isImporting ? 'Importing…' : 'Import CSV'}
          </Button>

          <Button variant="outline" onClick={handleExport} disabled={filteredEmployees.length === 0}>
            <Upload className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button
            className="gradient-primary"
            onClick={() => setAddDialogOpen(true)}
            disabled={!canCreateEmployee || isCreating}
            title={!canCreateEmployee ? accessDeniedMessage('creating employees') : undefined}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, email, or position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'az' | 'za')}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="az">Name A-Z</SelectItem>
                <SelectItem value="za">Name Z-A</SelectItem>
              </SelectContent>
            </Select>

            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as 'grid' | 'list')}
              className="justify-start"
            >
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>

      {/* Employee Cards Grid */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((employee) => (
            <Card
              key={employee.id}
              className="card-interactive cursor-pointer"
              onClick={() => handleViewProfile(employee)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 avatar-ring">
                      <AvatarImage src={employee.avatar} alt={`${employee.firstName} ${employee.lastName}`} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {employee.firstName[0]}
                        {employee.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{employee.position}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            employmentTypeColors[employee.employmentType]
                          )}
                        >
                          {employmentTypeLabels[employee.employmentType]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProfile(employee);
                        }}
                      >
                        View Profile
                      </DropdownMenuItem>

                      {/* Hide edit actions if user cannot manage employees */}
                      {canManageEmployees ? (
                        <>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProfile(employee);
                            }}
                          >
                            View Documents
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className={employee.status === 'inactive' ? 'text-success' : 'text-destructive'}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeactivateEmployee(employee);
                            }}
                          >
                            {employee.status === 'inactive' ? 'Reactivate' : 'Deactivate'}
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            toast({
                              title: 'Access restricted',
                              description: accessDeniedMessage('employee records'),
                              variant: 'destructive',
                            });
                          }}
                        >
                          No actions available
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Department</span>
                    <span className="font-medium">{employee.department || 'Not assigned'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Compliance</span>
                    <StatusBadge status={employee.complianceStatus} size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pay Rate</span>
                    <span className="font-medium">${(employee.payRate || 0).toFixed(2)}/hr</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `mailto:${employee.email}`;
                    }}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `tel:${employee.phone}`;
                    }}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Employee List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredEmployees.map((employee) => (
            <Card
              key={employee.id}
              className="card-interactive cursor-pointer"
              onClick={() => handleViewProfile(employee)}
            >
              <CardContent className="py-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 avatar-ring">
                      <AvatarImage src={employee.avatar} alt={`${employee.firstName} ${employee.lastName}`} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {employee.firstName[0]}
                        {employee.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">{employee.position}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        employmentTypeColors[employee.employmentType]
                      )}
                    >
                      {employmentTypeLabels[employee.employmentType]}
                    </span>
                    <span className="text-muted-foreground">
                      {employee.department || 'Not assigned'}
                    </span>
                    <StatusBadge status={employee.complianceStatus} size="sm" />
                    <span className="font-medium">${(employee.payRate || 0).toFixed(2)}/hr</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `mailto:${employee.email}`;
                      }}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `tel:${employee.phone}`;
                      }}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewProfile(employee);
                          }}
                        >
                          View Profile
                        </DropdownMenuItem>

                        {canManageEmployees ? (
                          <>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewProfile(employee);
                              }}
                            >
                              View Documents
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className={employee.status === 'inactive' ? 'text-success' : 'text-destructive'}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeactivateEmployee(employee);
                              }}
                            >
                              {employee.status === 'inactive' ? 'Reactivate' : 'Deactivate'}
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              toast({
                                title: 'Access restricted',
                                description: accessDeniedMessage('employee records'),
                                variant: 'destructive',
                              });
                            }}
                          >
                            No actions available
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredEmployees.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No employees found matching your criteria.</p>
          </CardContent>
        </Card>
      )}

      {/* Add Employee Dialog */}
      <AddEmployeeDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onAdd={handleAddEmployee} />

      {/* Employee Detail Sheet */}
      <EmployeeDetailSheet
        employee={selectedEmployee}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onUpdate={handleUpdateEmployee}
        onSaveCertification={(certification, documentFile, overallStatus) => {
          if (selectedEmployee) {
            return handleSaveCertification(selectedEmployee, certification, documentFile, overallStatus);
          }
        }}
        onDeleteCertification={(certificationId, overallStatus) => {
          if (selectedEmployee) {
            return handleDeleteCertification(selectedEmployee, certificationId, overallStatus);
          }
        }}
        onUploadDocument={(file) => {
          if (selectedEmployee) {
            return handleUploadEmployeeDocument(selectedEmployee, file);
          }
        }}
      />
    </div>
  );
}
