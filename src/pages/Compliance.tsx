import { useState, useMemo } from 'react';
import { Search, Filter, AlertTriangle, CheckCircle, XCircle, Clock, Download, Upload, Users, FileCheck, ChevronDown, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';
import { useComplianceRules } from '@/hooks/useDocuments';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { ComplianceStatus } from '@/types/hrms';
import type { ComplianceRule } from '@/types/portal';
import type { EmployeeDB, EmployeeCertificationDB, ComplianceStatusDB } from '@/types/database';

const certTypeLabels: Record<string, string> = {
  police_check: 'Police Check',
  ndis_screening: 'NDIS Screening',
  first_aid: 'First Aid',
  cpr: 'CPR',
  training: 'Training',
  other: 'Other',
};

const statusColors: Record<string, string> = {
  compliant: 'bg-success text-success-foreground',
  expiring: 'bg-warning text-warning-foreground',
  expired: 'bg-destructive text-destructive-foreground',
  pending: 'bg-muted text-muted-foreground',
};

// Transform DB employee with certifications for display
interface EmployeeWithCerts extends EmployeeDB {
  certifications: EmployeeCertificationDB[];
}

function deriveComplianceStatus(certs: EmployeeCertificationDB[]): ComplianceStatusDB {
  if (certs.length === 0) return 'pending';
  const statuses = certs.map((c) => c.status);
  if (statuses.includes('expired')) return 'expired';
  if (statuses.includes('expiring')) return 'expiring';
  if (statuses.includes('pending')) return 'pending';
  return 'compliant';
}

export default function Compliance() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterCertType, setFilterCertType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeView, setActiveView] = useState<'certifications' | 'employees' | 'requirements'>('certifications');

  // Use Supabase data exclusively - no localStorage fallback
  const { 
    employees: dbEmployees, 
    certifications: dbCertifications, 
    getCertificationsForEmployee,
    isLoading, 
    error 
  } = useSupabaseEmployees();
  const { rules: complianceRules, loading: complianceRulesLoading } = useComplianceRules();

  // Combine employees with their certifications and filter out inactive
  const activeEmployees = useMemo(() => {
    return dbEmployees
      .filter((e) => e.status !== 'inactive')
      .map((emp): EmployeeWithCerts => {
        const certs = getCertificationsForEmployee(emp.id);
        return {
          ...emp,
          certifications: certs,
          compliance_status: deriveComplianceStatus(certs),
        };
      });
  }, [dbEmployees, getCertificationsForEmployee]);

  // Get unique departments and certification types from Supabase data
  const departments = useMemo(() => 
    [...new Set(activeEmployees.map((e) => e.department).filter(Boolean))].sort() as string[],
    [activeEmployees]
  );

  const certTypes = useMemo(() => 
    [...new Set(dbCertifications.map((c) => c.type))].sort(),
    [dbCertifications]
  );

  // Calculate compliance stats from Supabase data
  const stats = useMemo(() => ({
    compliant: activeEmployees.filter((e) => e.compliance_status === 'compliant').length,
    expiring: activeEmployees.filter((e) => e.compliance_status === 'expiring').length,
    expired: activeEmployees.filter((e) => e.compliance_status === 'expired').length,
    pending: activeEmployees.filter((e) => e.compliance_status === 'pending').length,
  }), [activeEmployees]);

  const complianceRate = activeEmployees.length > 0 
    ? Math.round((stats.compliant / activeEmployees.length) * 100) 
    : 0;

  // Get all certifications with employee info
  const allCertifications = useMemo(() => 
    activeEmployees.flatMap((employee) =>
      employee.certifications.map((cert) => ({
        id: cert.id,
        name: cert.name,
        type: cert.type,
        issueDate: cert.issue_date || '',
        expiryDate: cert.expiry_date || '',
        status: cert.status,
        employeeId: employee.id,
        employeeName: `${employee.first_name} ${employee.last_name}`,
        employeeInitials: `${employee.first_name[0] || ''}${employee.last_name[0] || ''}`,
        department: employee.department || 'Unassigned',
      }))
    ),
    [activeEmployees]
  );

  // Certification type statistics
  const certTypeStats = useMemo(() => {
    const statsMap: Record<string, { total: number; compliant: number; expiring: number; expired: number; pending: number }> = {};
    
    allCertifications.forEach((cert) => {
      if (!statsMap[cert.type]) {
        statsMap[cert.type] = { total: 0, compliant: 0, expiring: 0, expired: 0, pending: 0 };
      }
      statsMap[cert.type].total++;
      const status = cert.status as keyof typeof statsMap[string];
      if (status in statsMap[cert.type]) {
        statsMap[cert.type][status]++;
      }
    });

    return Object.entries(statsMap).map(([type, data]) => ({
      type,
      label: certTypeLabels[type] || type,
      ...data,
      complianceRate: data.total > 0 ? Math.round((data.compliant / data.total) * 100) : 0,
    }));
  }, [allCertifications]);

  // Filter certifications
  const filteredCertifications = useMemo(() => 
    allCertifications.filter((cert) => {
      const matchesSearch = 
        cert.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = filterDepartment === 'all' || cert.department === filterDepartment;
      const matchesCertType = filterCertType === 'all' || cert.type === filterCertType;
      const matchesStatus = filterStatus === 'all' || cert.status === filterStatus;
      
      return matchesSearch && matchesDepartment && matchesCertType && matchesStatus;
    }),
    [allCertifications, searchQuery, filterDepartment, filterCertType, filterStatus]
  );

  // Filter employees
  const filteredEmployees = useMemo(() => 
    activeEmployees.filter((employee) => {
      const matchesSearch = 
        `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = filterDepartment === 'all' || employee.department === filterDepartment;
      const matchesStatus = filterStatus === 'all' || employee.compliance_status === filterStatus;
      
      return matchesSearch && matchesDepartment && matchesStatus;
    }),
    [activeEmployees, searchQuery, filterDepartment, filterStatus]
  );

  const filteredRequirements = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return complianceRules;
    return complianceRules.filter((rule) => {
      const docName = rule.document_type?.name?.toLowerCase() || '';
      return docName.includes(query);
    });
  }, [complianceRules, searchQuery]);

  // Export functionality
  const handleExportCSV = () => {
    const headers = ['Employee', 'Department', 'Certification', 'Type', 'Issue Date', 'Expiry Date', 'Status', 'Days Remaining'];
    
    const rows = filteredCertifications.map((cert) => {
      const daysRemaining = cert.expiryDate 
        ? differenceInDays(parseISO(cert.expiryDate), new Date())
        : 'N/A';
      
      return [
        cert.employeeName,
        cert.department,
        cert.name,
        certTypeLabels[cert.type] || cert.type,
        cert.issueDate ? format(parseISO(cert.issueDate), 'yyyy-MM-dd') : '',
        cert.expiryDate ? format(parseISO(cert.expiryDate), 'yyyy-MM-dd') : '',
        cert.status,
        daysRemaining.toString(),
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `compliance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast({
      title: 'Report Exported',
      description: `Exported ${filteredCertifications.length} certification records to CSV.`,
    });
  };

  const handleExportEmployeeSummary = () => {
    const headers = ['Employee', 'Department', 'Status', 'Total Certs', 'Compliant', 'Expiring', 'Expired', 'Pending'];
    
    const rows = filteredEmployees.map((employee) => {
      const certStats = {
        total: employee.certifications.length,
        compliant: employee.certifications.filter((c) => c.status === 'compliant').length,
        expiring: employee.certifications.filter((c) => c.status === 'expiring').length,
        expired: employee.certifications.filter((c) => c.status === 'expired').length,
        pending: employee.certifications.filter((c) => c.status === 'pending').length,
      };
      
      return [
        `${employee.first_name} ${employee.last_name}`,
        employee.department || 'Unassigned',
        employee.compliance_status,
        certStats.total.toString(),
        certStats.compliant.toString(),
        certStats.expiring.toString(),
        certStats.expired.toString(),
        certStats.pending.toString(),
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `employee-compliance-summary-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast({
      title: 'Summary Exported',
      description: `Exported ${filteredEmployees.length} employee compliance summaries to CSV.`,
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    if (activeView !== 'requirements') {
      setFilterDepartment('all');
      setFilterCertType('all');
      setFilterStatus('all');
    }
  };

  const hasActiveFilters = activeView === 'requirements'
    ? Boolean(searchQuery)
    : Boolean(searchQuery) || filterDepartment !== 'all' || filterCertType !== 'all' || filterStatus !== 'all';

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  // Show error state - fail closed, do not fall back to localStorage
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 max-w-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <XCircle className="h-12 w-12 text-destructive" />
            <h2 className="text-lg font-semibold">Unable to Load Compliance Data</h2>
            <p className="text-sm text-muted-foreground">
              The compliance dashboard cannot be displayed because employee data could not be retrieved from the database.
              Please try again or contact support if the issue persists.
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Compliance Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track certifications, clearances, and training requirements across your team.
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileCheck className="h-4 w-4 mr-2" />
                Export Certifications (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportEmployeeSummary}>
                <Users className="h-4 w-4 mr-2" />
                Export Employee Summary (CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className={cn(
            "card-interactive cursor-pointer transition-all",
            filterStatus === 'compliant' && "ring-2 ring-success"
          )}
          onClick={() => setFilterStatus(filterStatus === 'compliant' ? 'all' : 'compliant')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.compliant}</p>
                <p className="text-sm text-muted-foreground">Compliant</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={cn(
            "card-interactive cursor-pointer transition-all",
            filterStatus === 'expiring' && "ring-2 ring-warning"
          )}
          onClick={() => setFilterStatus(filterStatus === 'expiring' ? 'all' : 'expiring')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.expiring}</p>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={cn(
            "card-interactive cursor-pointer transition-all",
            filterStatus === 'expired' && "ring-2 ring-destructive"
          )}
          onClick={() => setFilterStatus(filterStatus === 'expired' ? 'all' : 'expired')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.expired}</p>
                <p className="text-sm text-muted-foreground">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={cn(
            "card-interactive cursor-pointer transition-all",
            filterStatus === 'pending' && "ring-2 ring-info"
          )}
          onClick={() => setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <Clock className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Rate & Certification Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Overall Compliance Rate</CardTitle>
            <CardDescription>Percentage of employees fully compliant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Progress value={complianceRate} className="flex-1 h-3" />
              <span className="text-2xl font-bold text-primary">{complianceRate}%</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {stats.compliant} of {activeEmployees.length} employees have all required certifications up to date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Compliance by Certification Type</CardTitle>
            <CardDescription>Status breakdown for each certification type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {certTypeStats.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No certification data available
                </p>
              ) : (
                certTypeStats.map((stat) => (
                  <div key={stat.type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{stat.label}</span>
                      <span className="text-muted-foreground">
                        {stat.compliant}/{stat.total} compliant
                      </span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                      {stat.compliant > 0 && (
                        <div 
                          className="bg-success transition-all" 
                          style={{ width: `${(stat.compliant / stat.total) * 100}%` }} 
                        />
                      )}
                      {stat.expiring > 0 && (
                        <div 
                          className="bg-warning transition-all" 
                          style={{ width: `${(stat.expiring / stat.total) * 100}%` }} 
                        />
                      )}
                      {stat.expired > 0 && (
                        <div 
                          className="bg-destructive transition-all" 
                          style={{ width: `${(stat.expired / stat.total) * 100}%` }} 
                        />
                      )}
                      {stat.pending > 0 && (
                        <div 
                          className="bg-muted-foreground/30 transition-all" 
                          style={{ width: `${(stat.pending / stat.total) * 100}%` }} 
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={
                    activeView === 'requirements'
                      ? 'Search requirements by document name...'
                      : 'Search by employee or certification...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {activeView !== 'requirements' && (
                <>
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
                  <Select value={filterCertType} onValueChange={setFilterCertType}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Certification Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="all">All Types</SelectItem>
                      {certTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {certTypeLabels[type] || type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="compliant">Compliant</SelectItem>
                      <SelectItem value="expiring">Expiring</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
            
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchQuery}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                  </Badge>
                )}
                {activeView !== 'requirements' && filterDepartment !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {filterDepartment}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterDepartment('all')} />
                  </Badge>
                )}
                {activeView !== 'requirements' && filterCertType !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {certTypeLabels[filterCertType] || filterCertType}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterCertType('all')} />
                  </Badge>
                )}
                {activeView !== 'requirements' && filterStatus !== 'all' && (
                  <Badge variant="secondary" className="gap-1 capitalize">
                    {filterStatus}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterStatus('all')} />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">Compliance Details</CardTitle>
            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'certifications' | 'employees' | 'requirements')}>
              <TabsList>
                <TabsTrigger value="certifications" className="gap-2">
                  <FileCheck className="h-4 w-4" />
                  Certifications ({filteredCertifications.length})
                </TabsTrigger>
                <TabsTrigger value="employees" className="gap-2">
                  <Users className="h-4 w-4" />
                  Employees ({filteredEmployees.length})
                </TabsTrigger>
                <TabsTrigger value="requirements" className="gap-2">
                  <FileCheck className="h-4 w-4" />
                  Requirements ({filteredRequirements.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {activeView === 'certifications' ? (
            <CertificationsTable certifications={filteredCertifications} />
          ) : activeView === 'employees' ? (
            <EmployeesComplianceTable employees={filteredEmployees} />
          ) : (
            <RequirementsTable requirements={filteredRequirements} loading={complianceRulesLoading} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface CertificationWithEmployee {
  id: string;
  name: string;
  type: string;
  issueDate: string;
  expiryDate: string;
  status: ComplianceStatusDB;
  employeeId: string;
  employeeName: string;
  employeeInitials: string;
  department: string;
}

function CertificationsTable({ certifications }: { certifications: CertificationWithEmployee[] }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Certification</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {certifications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No certifications found matching your filters
              </TableCell>
            </TableRow>
          ) : (
            certifications.map((cert) => {
              const daysUntilExpiry = cert.expiryDate
                ? differenceInDays(parseISO(cert.expiryDate), new Date())
                : null;

              return (
                <TableRow key={cert.id} className="table-row-interactive">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {cert.employeeInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{cert.employeeName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{cert.department}</span>
                  </TableCell>
                  <TableCell>{cert.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {certTypeLabels[cert.type] || cert.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {cert.expiryDate ? (
                      <div>
                        <span className="text-sm">
                          {format(parseISO(cert.expiryDate), 'dd MMM yyyy')}
                        </span>
                        {daysUntilExpiry !== null && (
                          <span
                            className={cn(
                              'text-xs block',
                              daysUntilExpiry < 0
                                ? 'text-destructive'
                                : daysUntilExpiry < 30
                                ? 'text-warning'
                                : 'text-muted-foreground'
                            )}
                          >
                            {daysUntilExpiry < 0
                              ? `${Math.abs(daysUntilExpiry)} days overdue`
                              : `${daysUntilExpiry} days remaining`}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Pending</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={cert.status as ComplianceStatus} size="sm" />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function EmployeesComplianceTable({ employees }: { employees: EmployeeWithCerts[] }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Overall Status</TableHead>
            <TableHead>Certifications</TableHead>
            <TableHead>Compliance Progress</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No employees found matching your filters
              </TableCell>
            </TableRow>
          ) : (
            employees.map((employee) => {
              const certStats = {
                total: employee.certifications.length,
                compliant: employee.certifications.filter((c) => c.status === 'compliant').length,
                expiring: employee.certifications.filter((c) => c.status === 'expiring').length,
                expired: employee.certifications.filter((c) => c.status === 'expired').length,
                pending: employee.certifications.filter((c) => c.status === 'pending').length,
              };
              const compliancePercent = certStats.total > 0 
                ? Math.round((certStats.compliant / certStats.total) * 100) 
                : 0;

              return (
                <TableRow key={employee.id} className="table-row-interactive">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {employee.first_name[0]}{employee.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium block">{employee.first_name} {employee.last_name}</span>
                        <span className="text-xs text-muted-foreground">{employee.position || 'No position'}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{employee.department || 'Unassigned'}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={employee.compliance_status as ComplianceStatus} size="sm" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {certStats.compliant > 0 && (
                        <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                          {certStats.compliant} ✓
                        </Badge>
                      )}
                      {certStats.expiring > 0 && (
                        <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                          {certStats.expiring} ⚠
                        </Badge>
                      )}
                      {certStats.expired > 0 && (
                        <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                          {certStats.expired} ✗
                        </Badge>
                      )}
                      {certStats.pending > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {certStats.pending} pending
                        </Badge>
                      )}
                      {certStats.total === 0 && (
                        <span className="text-xs text-muted-foreground">No certifications</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Progress value={compliancePercent} className="h-2 flex-1" />
                      <span className="text-xs font-medium w-10 text-right">{compliancePercent}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function getRequirementTargetLabel(rule: ComplianceRule) {
  if (rule.target_type === 'all') return 'All roles';
  if (rule.target_type === 'role') return rule.target_value || 'Role';
  if (rule.target_type === 'department') return rule.target_value || 'Department';
  if (rule.target_type === 'location') return rule.target_value || 'Location';
  return rule.target_value || rule.target_type;
}

function RequirementsTable({
  requirements,
  loading,
}: {
  requirements: ComplianceRule[];
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Document Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Applies To</TableHead>
            <TableHead>Required</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                Loading requirements...
              </TableCell>
            </TableRow>
          ) : requirements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                No compliance requirements found
              </TableCell>
            </TableRow>
          ) : (
            requirements.map((rule) => (
              <TableRow key={rule.id} className="table-row-interactive">
                <TableCell className="font-medium">
                  {rule.document_type?.name || 'Unknown document'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {rule.document_type?.category || 'Document'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {getRequirementTargetLabel(rule)}
                </TableCell>
                <TableCell>
                  <Badge variant={rule.is_required ? 'default' : 'secondary'}>
                    {rule.is_required ? 'Required' : 'Optional'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
