import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { ComplianceStatus } from '@/types/hrms';
import type { EmployeeCertificationDB, EmployeeDB } from '@/types/database';

type EmployeeWithCerts = EmployeeDB & { certifications: EmployeeCertificationDB[] };

type EmployeeDocument = {
  id: string;
  document_type_id: string;
  file_name: string;
  file_url: string | null;
  expiry_date: string | null;
  created_at: string;
};

interface ComplianceEmployeeDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployeeWithCerts | null;
  documents: EmployeeDocument[];
  documentsLoading: boolean;
  getCertTypeLabel: (type: string, documentTypeId?: string | null) => string;
  complianceDocumentTypes: Array<{ id: string; name: string }>;
}

export function ComplianceEmployeeDetailDialog({
  open,
  onOpenChange,
  employee,
  documents,
  documentsLoading,
  getCertTypeLabel,
  complianceDocumentTypes,
}: ComplianceEmployeeDetailDialogProps) {
  if (!employee) return null;

  const docsByTypeId = new Map<string, EmployeeDocument>();
  documents.forEach((doc) => {
    if (!docsByTypeId.has(doc.document_type_id)) {
      docsByTypeId.set(doc.document_type_id, doc);
    }
  });
  const certByDocTypeId = new Map<string, EmployeeCertificationDB>();
  employee.certifications.forEach((cert) => {
    const docTypeId =
      (cert as any).document_type_id ||
      (cert.type &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        cert.type
      )
        ? cert.type
        : null);
    if (docTypeId && !certByDocTypeId.has(docTypeId)) {
      certByDocTypeId.set(docTypeId, cert);
    }
  });

  const rows = complianceDocumentTypes.length
    ? complianceDocumentTypes.map((docType) => ({
        id: docType.id,
        name: docType.name,
        cert: certByDocTypeId.get(docType.id) || null,
      }))
    : employee.certifications.map((cert) => ({
        id: cert.id,
        name: getCertTypeLabel(cert.type, (cert as any).document_type_id || null),
        cert,
      }));

  const compliancePercent =
    rows.length === 0
      ? 0
      : Math.round(
          ((rows.length -
            rows.filter((row) => {
              const doc = docsByTypeId.get(row.id);
              const hasDoc = Boolean(doc?.file_name);
              const expirySource = doc?.expiry_date || row.cert?.expiry_date || null;
              const expiryDate = expirySource ? new Date(expirySource) : null;
              const isExpired = expiryDate ? expiryDate.getTime() < Date.now() : false;
              return !hasDoc || isExpired;
            }).length) /
            rows.length) *
            100
        );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {employee.first_name} {employee.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Compliance</span>
              <span className="font-medium">{compliancePercent}%</span>
            </div>
            <Progress value={compliancePercent} className="h-2 mt-2" />
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Compliance Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>File name</TableHead>
                  <TableHead>Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No compliance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const cert = row.cert;
                    const doc = docsByTypeId.get(row.id) || null;
                    const complianceName = row.name;
                    const expirySource = doc?.expiry_date || cert?.expiry_date || null;
                    const expiryDate = expirySource ? new Date(expirySource) : null;
                    const isExpired = expiryDate ? expiryDate.getTime() < Date.now() : false;
                    const progressValue = doc?.file_name && !isExpired ? 100 : 0;

                    return (
                      <TableRow key={row.id} className="table-row-interactive">
                        <TableCell className="font-medium">{complianceName}</TableCell>
                        <TableCell>
                          <StatusBadge status={(cert?.status || 'pending') as ComplianceStatus} size="sm" />
                        </TableCell>
                        <TableCell>
                          {expiryDate ? format(expiryDate, 'dd MMM yyyy') : 'Not set'}
                        </TableCell>
                        <TableCell>
                          {documentsLoading ? 'Loading...' : doc?.file_name || '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <Progress value={progressValue} className="h-2 flex-1" />
                            <span className="text-xs font-medium w-10 text-right">{progressValue}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
