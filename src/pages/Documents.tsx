import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Upload, 
  Search,
  FolderOpen,
  Send,
  BarChart3
} from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import { DocumentLibraryTab } from '@/components/documents/DocumentLibraryTab';
import { DistributionsTab } from '@/components/documents/DistributionsTab';
import { UploadDocumentDialog } from '@/components/documents/UploadDocumentDialog';
import { useOrgDocuments, useDocumentDistributions } from '@/hooks/useOrgDocuments';

export default function Documents() {
  const [activeTab, setActiveTab] = useState('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  
  const { documents, loading: docsLoading } = useOrgDocuments();
  const { distributions, loading: distLoading } = useDocumentDistributions();

  const activeDocuments = documents.filter(d => d.is_active);
  const pendingDistributions = distributions.filter(d => 
    d.status === 'pending' || d.status === 'sent'
  );
  const acknowledgedDistributions = distributions.filter(d => 
    d.status === 'acknowledged' || d.status === 'signed'
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Document Library</h1>
          <p className="text-muted-foreground mt-1">
            Manage organizational documents and distribute to employees
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Documents"
          value={activeDocuments.length}
          description="Active documents"
          icon={FileText}
          variant="default"
        />
        <MetricCard
          title="Categories"
          value={new Set(documents.map(d => d.category)).size}
          description="Document types"
          icon={FolderOpen}
          variant="info"
        />
        <MetricCard
          title="Pending Actions"
          value={pendingDistributions.length}
          description="Awaiting response"
          icon={Send}
          variant="warning"
        />
        <MetricCard
          title="Completed"
          value={acknowledgedDistributions.length}
          description="Acknowledged/Signed"
          icon={BarChart3}
          variant="success"
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="library" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Document Library</span>
            <span className="sm:hidden">Library</span>
          </TabsTrigger>
          <TabsTrigger value="distributions" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Distributions</span>
            <span className="sm:hidden">Sent</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library">
          <DocumentLibraryTab searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="distributions">
          <DistributionsTab searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>

      <UploadDocumentDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
