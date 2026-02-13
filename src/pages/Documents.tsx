import { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Upload, 
  Search,
  FolderOpen,
  Send,
  BarChart3,
  Filter,
  Users
} from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import { DocumentLibraryTab } from '@/components/documents/DocumentLibraryTab';
import { DistributionsTab } from '@/components/documents/DistributionsTab';
import { UploadDocumentDialog } from '@/components/documents/UploadDocumentDialog';
import { useOrgDocuments, useDocumentDistributions } from '@/hooks/useOrgDocuments';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';

export default function Documents() {
  const [activeTab, setActiveTab] = useState('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [requirementFilter, setRequirementFilter] = useState<'all' | 'ack' | 'sign' | 'none'>('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  
  const { documents, loading: docsLoading } = useOrgDocuments();
  const { distributions, loading: distLoading } = useDocumentDistributions();
  const { employees, isLoading: employeesLoading } = useSupabaseEmployees();

  const activeDocuments = documents.filter(d => d.is_active);
  const pendingDistributions = distributions.filter(d => 
    d.status === 'pending' || d.status === 'sent'
  );
  const acknowledgedDistributions = distributions.filter(d => 
    d.status === 'acknowledged' || d.status === 'signed'
  );
  const metricsLoading = docsLoading || distLoading;

  const categoryOptions = useMemo(
    () => Array.from(new Set(documents.map((doc) => doc.category))).filter(Boolean),
    [documents]
  );

  const employeeOptions = useMemo(
    () => employees
      .filter((emp) => emp.status === 'active')
      .map((emp) => ({
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`.trim(),
        email: emp.email,
      })),
    [employees]
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
          value={metricsLoading ? '—' : activeDocuments.length}
          description="Active documents"
          icon={FileText}
          variant="default"
        />
        <MetricCard
          title="Categories"
          value={metricsLoading ? '—' : new Set(documents.map(d => d.category)).size}
          description="Document types"
          icon={FolderOpen}
          variant="info"
        />
        <MetricCard
          title="Pending Actions"
          value={metricsLoading ? '—' : pendingDistributions.length}
          description="Awaiting response"
          icon={Send}
          variant="warning"
        />
        <MetricCard
          title="Completed"
          value={metricsLoading ? '—' : acknowledgedDistributions.length}
          description="Acknowledged/Signed"
          icon={BarChart3}
          variant="success"
        />
      </div>

      {/* Search */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {activeTab === 'library' && (
          <>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Categories</SelectItem>
                {categoryOptions.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={requirementFilter} onValueChange={(value) => setRequirementFilter(value as typeof requirementFilter)}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All requirements" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Requirements</SelectItem>
                <SelectItem value="ack">Acknowledgment Required</SelectItem>
                <SelectItem value="sign">Signature Required</SelectItem>
                <SelectItem value="none">No Requirement</SelectItem>
              </SelectContent>
            </Select>
            <Select value={employeeFilter} onValueChange={setEmployeeFilter} disabled={employeesLoading}>
              <SelectTrigger className="w-[240px]">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue placeholder={employeesLoading ? 'Loading employees...' : 'All employees'} />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Employees</SelectItem>
                {employeeOptions.map((employee) => (
                  <SelectItem key={employee.id} value={employee.email}>
                    {employee.name} ({employee.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
        {activeTab === 'distributions' && (
          <Select value={employeeFilter} onValueChange={setEmployeeFilter} disabled={employeesLoading}>
            <SelectTrigger className="w-[240px]">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder={employeesLoading ? 'Loading employees...' : 'All employees'} />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All Employees</SelectItem>
              {employeeOptions.map((employee) => (
                <SelectItem key={employee.id} value={employee.email}>
                  {employee.name} ({employee.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
          <DocumentLibraryTab
            searchQuery={searchQuery}
            categoryFilter={categoryFilter}
            requirementFilter={requirementFilter}
            employeeFilter={employeeFilter}
          />
        </TabsContent>

        <TabsContent value="distributions">
          <DistributionsTab searchQuery={searchQuery} employeeFilter={employeeFilter} />
        </TabsContent>
      </Tabs>

      <UploadDocumentDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
