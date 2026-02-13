import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  FileText, 
  Loader2,
  Clock,
  Eye,
  Download,
  Check,
  FileSignature
} from 'lucide-react';
import { format } from 'date-fns';
import { useDocumentDistributions, useOrgDocuments } from '@/hooks/useOrgDocuments';
import type { Database } from '@/integrations/supabase/types';

type DistributionStatus = Database['public']['Enums']['distribution_status'];

interface DistributionsTabProps {
  searchQuery: string;
  employeeFilter: string;
}

const statusConfig: Record<DistributionStatus, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-gray-100 text-gray-800' },
  sent: { label: 'Sent', icon: FileText, className: 'bg-blue-100 text-blue-800' },
  viewed: { label: 'Viewed', icon: Eye, className: 'bg-purple-100 text-purple-800' },
  downloaded: { label: 'Downloaded', icon: Download, className: 'bg-teal-100 text-teal-800' },
  acknowledged: { label: 'Acknowledged', icon: Check, className: 'bg-green-100 text-green-800' },
  signed: { label: 'Signed', icon: FileSignature, className: 'bg-emerald-100 text-emerald-800' },
};

export function DistributionsTab({ searchQuery, employeeFilter }: DistributionsTabProps) {
  const { distributions, loading } = useDocumentDistributions();
  const { documents } = useOrgDocuments();
  
  // Create a map for quick document lookup
  const documentMap = new Map(documents.map(d => [d.id, d]));

  const filteredDistributions = distributions.filter(dist => {
    const doc = documentMap.get(dist.org_document_id);
    const matchesEmployee = employeeFilter === 'all' || dist.recipient_email === employeeFilter;
    return (
      matchesEmployee && (
        dist.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dist.recipient_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc?.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Document Distributions</CardTitle>
        <CardDescription>
          Track document distribution status and employee acknowledgments
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filteredDistributions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No distributions found</p>
            <p className="text-sm mt-1">Distribute a document to employees to track here</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Last Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDistributions.map((dist) => {
                const doc = documentMap.get(dist.org_document_id);
                const status = statusConfig[dist.status];
                const StatusIcon = status.icon;
                
                // Determine last action timestamp
                const lastAction = dist.signed_at || dist.acknowledged_at || 
                  dist.downloaded_at || dist.viewed_at || dist.sent_at;
                
                return (
                  <TableRow key={dist.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {dist.recipient_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{dist.recipient_name}</p>
                          <p className="text-xs text-muted-foreground">{dist.recipient_email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{doc?.title || 'Unknown Document'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`gap-1 ${status.className}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {dist.sent_at ? format(new Date(dist.sent_at), 'dd MMM yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lastAction ? format(new Date(lastAction), 'dd MMM yyyy HH:mm') : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
