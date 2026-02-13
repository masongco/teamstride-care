import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  FileText, 
  Download, 
  Send, 
  Trash2, 
  Eye,
  Loader2,
  FileCheck,
  FileSignature
} from 'lucide-react';
import { format } from 'date-fns';
import { useDocumentDistributions, useOrgDocuments } from '@/hooks/useOrgDocuments';
import { DocumentDetailSheet } from './DocumentDetailSheet';
import { DistributeDocumentDialog } from './DistributeDocumentDialog';
import type { Database } from '@/integrations/supabase/types';

type OrgDocument = Database['public']['Tables']['org_documents']['Row'];

interface DocumentLibraryTabProps {
  searchQuery: string;
  categoryFilter: string;
  requirementFilter: 'all' | 'ack' | 'sign' | 'none';
  employeeFilter: string;
}

const categoryLabels: Record<string, string> = {
  contract_template: 'Contract Template',
  handbook: 'Handbook',
  policy: 'Policy',
  procedure: 'Procedure',
  training: 'Training',
  other: 'Other',
};

const categoryColors: Record<string, string> = {
  contract_template: 'bg-blue-100 text-blue-800',
  handbook: 'bg-purple-100 text-purple-800',
  policy: 'bg-amber-100 text-amber-800',
  procedure: 'bg-green-100 text-green-800',
  training: 'bg-teal-100 text-teal-800',
  other: 'bg-gray-100 text-gray-800',
};

export function DocumentLibraryTab({
  searchQuery,
  categoryFilter,
  requirementFilter,
  employeeFilter,
}: DocumentLibraryTabProps) {
  const { documents, loading, deleteDocument } = useOrgDocuments();
  const { distributions } = useDocumentDistributions();
  const [selectedDocument, setSelectedDocument] = useState<OrgDocument | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [distributeOpen, setDistributeOpen] = useState(false);

  const employeeDocIds = employeeFilter === 'all'
    ? null
    : new Set(
        distributions
          .filter((dist) => dist.recipient_email === employeeFilter)
          .map((dist) => dist.org_document_id)
      );

  const filteredDocuments = documents.filter((doc) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      doc.title.toLowerCase().includes(q) ||
      doc.description?.toLowerCase().includes(q) ||
      categoryLabels[doc.category]?.toLowerCase().includes(q);

    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;

    const matchesRequirement =
      requirementFilter === 'all' ||
      (requirementFilter === 'ack' && doc.requires_acknowledgment) ||
      (requirementFilter === 'sign' && doc.requires_signature) ||
      (requirementFilter === 'none' && !doc.requires_acknowledgment && !doc.requires_signature);

    const matchesEmployee = !employeeDocIds || employeeDocIds.has(doc.id);

    return matchesSearch && matchesCategory && matchesRequirement && matchesEmployee;
  });

  const handleView = (doc: OrgDocument) => {
    setSelectedDocument(doc);
    setDetailOpen(true);
  };

  const handleDistribute = (doc: OrgDocument) => {
    setSelectedDocument(doc);
    setDistributeOpen(true);
  };

  const handleDownload = (doc: OrgDocument) => {
    window.open(doc.file_url, '_blank');
  };

  const handleDelete = async (doc: OrgDocument) => {
    if (confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(doc.id);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Documents</CardTitle>
          <CardDescription>
            Organizational documents, policies, and templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents found</p>
              <p className="text-sm mt-1">Upload a document to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Requirements</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          {doc.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={categoryColors[doc.category]}>
                        {categoryLabels[doc.category]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {doc.requires_acknowledgment && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <FileCheck className="h-3 w-3" />
                            Ack
                          </Badge>
                        )}
                        {doc.requires_signature && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <FileSignature className="h-3 w-3" />
                            Sign
                          </Badge>
                        )}
                        {!doc.requires_acknowledgment && !doc.requires_signature && (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatFileSize(doc.file_size)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(doc.created_at), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => handleView(doc)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(doc)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDistribute(doc)}>
                            <Send className="h-4 w-4 mr-2" />
                            Distribute
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(doc)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedDocument && (
        <>
          <DocumentDetailSheet
            open={detailOpen}
            onOpenChange={setDetailOpen}
            document={selectedDocument}
          />
          <DistributeDocumentDialog
            open={distributeOpen}
            onOpenChange={setDistributeOpen}
            document={selectedDocument}
          />
        </>
      )}
    </>
  );
}
