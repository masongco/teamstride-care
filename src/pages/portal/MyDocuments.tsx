import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { 
  FileCheck, 
  Upload, 
  Eye, 
  RefreshCw, 
  Trash2, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  FileText,
  Download
} from 'lucide-react';
import { useEmployeeDocuments, useDocumentTypes } from '@/hooks/useDocuments';
import { format, differenceInDays, isPast } from 'date-fns';
import type { DocumentStatus, EmployeeDocument } from '@/types/portal';

const STATUS_CONFIG: Record<DocumentStatus, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: 'Pending Review', icon: Clock, className: 'bg-warning/10 text-warning' },
  approved: { label: 'Approved', icon: CheckCircle, className: 'bg-success/10 text-success' },
  rejected: { label: 'Rejected', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
  expired: { label: 'Expired', icon: AlertTriangle, className: 'bg-destructive/10 text-destructive' },
};

export default function MyDocuments() {
  const { documents, loading, uploadDocument, replaceDocument, deleteDocument } = useEmployeeDocuments();
  const { documentTypes, loading: typesLoading } = useDocumentTypes();
  
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [replaceDocId, setReplaceDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !selectedTypeId) return;

    setUploading(true);
    const result = await uploadDocument(file, selectedTypeId, issueDate || undefined, expiryDate || undefined);
    setUploading(false);

    if (result) {
      setUploadOpen(false);
      setSelectedTypeId('');
      setIssueDate('');
      setExpiryDate('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replaceDocId) return;

    setUploading(true);
    await replaceDocument(replaceDocId, file);
    setUploading(false);
    setReplaceDocId(null);
    if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
  };

  const handleDelete = async (docId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(docId);
    }
  };

  const getEffectiveStatus = (doc: EmployeeDocument): DocumentStatus => {
    if (doc.status === 'approved' && doc.expiry_date && isPast(new Date(doc.expiry_date))) {
      return 'expired';
    }
    return doc.status;
  };

  const getExpiryInfo = (doc: EmployeeDocument) => {
    if (!doc.expiry_date) return null;
    const days = differenceInDays(new Date(doc.expiry_date), new Date());
    if (days < 0) return { text: 'Expired', className: 'text-destructive' };
    if (days <= 30) return { text: `Expires in ${days} days`, className: 'text-warning' };
    return { text: format(new Date(doc.expiry_date), 'dd MMM yyyy'), className: 'text-muted-foreground' };
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_type?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const effectiveStatus = getEffectiveStatus(doc);
    const matchesStatus = statusFilter === 'all' || effectiveStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get missing required documents
  const requiredTypes = documentTypes.filter(dt => dt.is_required);
  const uploadedTypeIds = documents.map(d => d.document_type_id);
  const missingTypes = requiredTypes.filter(rt => !uploadedTypeIds.includes(rt.id));

  if (loading || typesLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Documents</h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage your compliance documents
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Missing Documents Alert */}
      {missingTypes.length > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Missing Required Documents</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please upload the following: {missingTypes.map(t => t.name).join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents found</p>
              <p className="text-sm mt-1">Upload your first document to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => {
                  const effectiveStatus = getEffectiveStatus(doc);
                  const statusConfig = STATUS_CONFIG[effectiveStatus];
                  const expiryInfo = getExpiryInfo(doc);
                  const canDelete = doc.status === 'pending';
                  const canReplace = doc.status !== 'approved' || effectiveStatus === 'expired';

                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <FileCheck className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium truncate max-w-[200px]">{doc.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded {format(new Date(doc.created_at), 'dd MMM yyyy')}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.document_type?.name || 'Unknown'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig.className}>
                          <statusConfig.icon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {expiryInfo ? (
                          <span className={`text-sm ${expiryInfo.className}`}>{expiryInfo.text}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">No expiry</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">v{doc.current_version}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <a href={doc.file_url} download={doc.file_name}>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          {canReplace && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setReplaceDocId(doc.id);
                                replaceFileInputRef.current?.click();
                              }}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(doc.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Hidden file input for replace */}
      <input
        ref={replaceFileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        onChange={handleReplace}
      />

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a new compliance document. Accepted formats: PDF, JPG, PNG, DOC, DOCX
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Document Type *</Label>
              <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(dt => (
                    <SelectItem key={dt.id} value={dt.id}>
                      {dt.name}
                      {dt.is_required && <span className="text-destructive ml-1">*</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Document File *</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedTypeId || !fileInputRef.current?.files?.[0] || uploading}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
