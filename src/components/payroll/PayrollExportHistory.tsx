import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, XCircle, History, Loader2, FileSpreadsheet } from 'lucide-react';
import type { PayrollExport } from '@/types/payroll';
import { PROVIDER_LABELS } from '@/types/payroll';

interface PayrollExportHistoryProps {
  exports: PayrollExport[];
  onDownload: (filePath: string) => Promise<string>;
  onVoid: (exportId: string, reason: string) => Promise<unknown>;
  isVoiding: boolean;
  isDownloading: boolean;
}

export function PayrollExportHistory({
  exports,
  onDownload,
  onVoid,
  isVoiding,
  isDownloading,
}: PayrollExportHistoryProps) {
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [selectedExport, setSelectedExport] = useState<PayrollExport | null>(null);
  const [voidReason, setVoidReason] = useState('');

  const handleDownload = async (filePath: string) => {
    const url = await onDownload(filePath);
    window.open(url, '_blank');
  };

  const handleVoidClick = (exp: PayrollExport) => {
    setSelectedExport(exp);
    setVoidReason('');
    setVoidDialogOpen(true);
  };

  const handleVoidConfirm = async () => {
    if (!selectedExport || !voidReason.trim()) return;
    await onVoid(selectedExport.id, voidReason);
    setVoidDialogOpen(false);
    setSelectedExport(null);
    setVoidReason('');
  };

  const getStatusBadge = (status: PayrollExport['status']) => {
    switch (status) {
      case 'generated':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Generated</Badge>;
      case 'voided':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Voided</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Export History
          </CardTitle>
          <CardDescription>
            View and download previous payroll exports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No exports yet</p>
              <p className="text-sm">Generate your first payroll export to see it here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Pay Period</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exports.map((exp) => (
                  <TableRow key={exp.id} className={exp.status === 'voided' ? 'opacity-60' : ''}>
                    <TableCell className="font-medium">
                      {format(new Date(exp.created_at), 'dd MMM yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {exp.pay_period && (
                        <span className="text-sm">
                          {format(new Date(exp.pay_period.start_date), 'dd MMM')} -{' '}
                          {format(new Date(exp.pay_period.end_date), 'dd MMM')}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{PROVIDER_LABELS[exp.provider]}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {exp.totals_summary.linesCount} lines, {exp.totals_summary.totalHours.toFixed(1)}h,{' '}
                      {exp.totals_summary.employeesCount} employees
                    </TableCell>
                    <TableCell>{getStatusBadge(exp.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {exp.created_by_name || exp.created_by_email}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {exp.file_urls.length > 0 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDownload(exp.file_urls[0])}
                            disabled={isDownloading}
                          >
                            {isDownloading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {exp.status === 'generated' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleVoidClick(exp)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Void Dialog */}
      <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void Export</DialogTitle>
            <DialogDescription>
              This will mark the export as voided. The file will remain but won't be considered valid.
              A reason is required for audit purposes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="void_reason">Reason for Voiding</Label>
              <Textarea
                id="void_reason"
                placeholder="Enter the reason for voiding this export..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleVoidConfirm}
              disabled={isVoiding || !voidReason.trim()}
            >
              {isVoiding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Void Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
