import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Download, 
  Calendar,
  User,
  FileCheck,
  FileSignature,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { useDocumentDistributions } from '@/hooks/useOrgDocuments';
import type { Database } from '@/integrations/supabase/types';

type OrgDocument = Database['public']['Tables']['org_documents']['Row'];

interface DocumentDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: OrgDocument;
}

const categoryLabels: Record<string, string> = {
  contract_template: 'Contract Template',
  handbook: 'Handbook',
  policy: 'Policy',
  procedure: 'Procedure',
  training: 'Training',
  other: 'Other',
};

export function DocumentDetailSheet({ open, onOpenChange, document }: DocumentDetailSheetProps) {
  const { distributions } = useDocumentDistributions(document.id);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const statusCounts = {
    pending: distributions.filter(d => d.status === 'pending' || d.status === 'sent').length,
    viewed: distributions.filter(d => d.status === 'viewed' || d.status === 'downloaded').length,
    completed: distributions.filter(d => d.status === 'acknowledged' || d.status === 'signed').length,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Document Details
          </SheetTitle>
          <SheetDescription>
            View document information and distribution status
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Document Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{document.title}</h3>
              {document.description && (
                <p className="text-sm text-muted-foreground mt-1">{document.description}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {categoryLabels[document.category]}
              </Badge>
              {document.requires_acknowledgment && (
                <Badge variant="outline" className="gap-1">
                  <FileCheck className="h-3 w-3" />
                  Requires Acknowledgment
                </Badge>
              )}
              {document.requires_signature && (
                <Badge variant="outline" className="gap-1">
                  <FileSignature className="h-3 w-3" />
                  Requires Signature
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* File Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">File Information</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">File Name</p>
                <p className="font-medium truncate">{document.file_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Size</p>
                <p className="font-medium">{formatFileSize(document.file_size)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Version</p>
                <p className="font-medium">v{document.version || 1}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium">{document.mime_type || 'Unknown'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Metadata</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Uploaded:</span>
                <span>{format(new Date(document.created_at), 'dd MMM yyyy HH:mm')}</span>
              </div>
              {document.uploaded_by_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">By:</span>
                  <span>{document.uploaded_by_name}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Distribution Summary */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Distribution Summary</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-warning/10 text-center">
                <p className="text-2xl font-bold text-warning">{statusCounts.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="p-3 rounded-lg bg-info/10 text-center">
                <p className="text-2xl font-bold text-info">{statusCounts.viewed}</p>
                <p className="text-xs text-muted-foreground">Viewed</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10 text-center">
                <p className="text-2xl font-bold text-success">{statusCounts.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={() => window.open(document.file_url, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              View
            </Button>
            <Button 
              className="flex-1 gap-2"
              onClick={() => window.open(document.file_url, '_blank')}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
