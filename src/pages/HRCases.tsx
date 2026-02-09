import { useState } from 'react';
import { format } from 'date-fns';
import { useHRCases } from '@/hooks/useHRCases';
import { useUserRole } from '@/hooks/useUserRole';
import { accessDeniedMessage } from '@/lib/errorMessages';
import { MetricCard } from '@/components/ui/metric-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Shield, 
  AlertTriangle,
  Download,
  Lock,
  Scale,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { CreateCaseDialog } from '@/components/hrCases/CreateCaseDialog';
import { CaseDetailSheet } from '@/components/hrCases/CaseDetailSheet';
import type { 
  HRCase, 
  HRCaseType, 
  HRCaseStatus, 
  HRCaseSeverity,
  CASE_TYPE_LABELS,
  CASE_STATUS_LABELS,
  CASE_SEVERITY_LABELS,
} from '@/types/hrCases';

// Get first organisation for now (will be from context later)
const TEMP_ORG_ID = '00000000-0000-0000-0000-000000000000';

export default function HRCases() {
  const { isAdmin, isManager, loading: roleLoading } = useUserRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<HRCaseStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<HRCaseType | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<HRCaseSeverity | 'all'>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const filters = {
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(typeFilter !== 'all' && { case_type: typeFilter }),
    ...(severityFilter !== 'all' && { severity: severityFilter }),
  };

  const { cases, stats, loading, refetch, createCase } = useHRCases(
    Object.keys(filters).length > 0 ? filters : undefined
  );

  // Filter cases by search query
  const filteredCases = cases.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.case_number.toLowerCase().includes(query) ||
      c.summary.toLowerCase().includes(query) ||
      c.employee?.first_name?.toLowerCase().includes(query) ||
      c.employee?.last_name?.toLowerCase().includes(query)
    );
  });

  // Access control - only admin/manager can access
  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin && !isManager) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">
              {accessDeniedMessage('HR Cases')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSeverityVariant = (severity: HRCaseSeverity): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  const getStatusVariant = (status: HRCaseStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'closed': return 'outline';
      case 'new': return 'default';
      default: return 'secondary';
    }
  };

  const handleExportCSV = () => {
    const headers = ['Case Number', 'Type', 'Status', 'Severity', 'Employee', 'Summary', 'Date Reported', 'Created At'];
    const rows = filteredCases.map(c => [
      c.case_number,
      c.case_type,
      c.status,
      c.severity,
      c.employee ? `${c.employee.first_name} ${c.employee.last_name}` : '',
      c.summary,
      c.date_reported,
      c.created_at,
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hr-cases-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">HR Cases</h1>
          <p className="text-muted-foreground">
            Manage incidents, misconduct, grievances, and disciplinary matters
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Case
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title="Total Cases"
            value={stats.total}
            icon={FileText}
          />
          <MetricCard
            title="Open Cases"
            value={stats.openCases}
            icon={Clock}
          />
          <MetricCard
            title="Closed Cases"
            value={stats.closedCases}
            icon={CheckCircle}
          />
          <MetricCard
            title="Safeguarding"
            value={stats.safeguardingCases}
            icon={Shield}
            className={stats.safeguardingCases > 0 ? 'border-destructive' : ''}
          />
          <MetricCard
            title="Active Warnings"
            value={stats.activeWarnings}
            icon={AlertTriangle}
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as HRCaseStatus | 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="triaged">Triaged</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="awaiting_response">Awaiting Response</SelectItem>
                <SelectItem value="decision_made">Decision Made</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as HRCaseType | 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="incident">Incident</SelectItem>
                <SelectItem value="misconduct">Misconduct</SelectItem>
                <SelectItem value="grievance">Grievance</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="complaint">Complaint</SelectItem>
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as HRCaseSeverity | 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Case Register</CardTitle>
          <CardDescription>
            {filteredCases.length} case{filteredCases.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredCases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No cases found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCases.map((hrCase) => (
                  <TableRow 
                    key={hrCase.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedCaseId(hrCase.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{hrCase.case_number}</span>
                        {hrCase.safeguarding_flag && (
                          <Shield className="h-4 w-4 text-destructive" />
                        )}
                        {hrCase.confidentiality_level === 'restricted' && (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {hrCase.case_type.charAt(0).toUpperCase() + hrCase.case_type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {hrCase.employee 
                        ? `${hrCase.employee.first_name} ${hrCase.employee.last_name}`
                        : <span className="text-muted-foreground">—</span>
                      }
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {hrCase.summary}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityVariant(hrCase.severity)}>
                        {hrCase.severity.charAt(0).toUpperCase() + hrCase.severity.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(hrCase.status)}>
                        {hrCase.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(hrCase.date_reported), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCaseId(hrCase.id);
                        }}
                      >
                        <Scale className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateCaseDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={createCase}
        organisationId={TEMP_ORG_ID}
      />

      <CaseDetailSheet
        caseId={selectedCaseId}
        open={!!selectedCaseId}
        onOpenChange={(open) => !open && setSelectedCaseId(null)}
        onUpdate={refetch}
      />
    </div>
  );
}
