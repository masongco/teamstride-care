import { useState } from 'react';
import { Search, Filter, AlertTriangle, CheckCircle, XCircle, Clock, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mockEmployees } from '@/lib/mock-data';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Compliance() {
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate compliance stats
  const stats = {
    compliant: mockEmployees.filter((e) => e.complianceStatus === 'compliant').length,
    expiring: mockEmployees.filter((e) => e.complianceStatus === 'expiring').length,
    expired: mockEmployees.filter((e) => e.complianceStatus === 'expired').length,
    pending: mockEmployees.filter((e) => e.complianceStatus === 'pending').length,
  };

  const complianceRate = Math.round((stats.compliant / mockEmployees.length) * 100);

  // Get all certifications with employee info
  const allCertifications = mockEmployees.flatMap((employee) =>
    employee.certifications.map((cert) => ({
      ...cert,
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      employeeInitials: `${employee.firstName[0]}${employee.lastName[0]}`,
    }))
  );

  const filteredCertifications = allCertifications.filter(
    (cert) =>
      cert.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const certTypeLabels: Record<string, string> = {
    police_check: 'Police Check',
    ndis_screening: 'NDIS Screening',
    first_aid: 'First Aid',
    cpr: 'CPR',
    training: 'Training',
    other: 'Other',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Compliance Management</h1>
          <p className="text-muted-foreground mt-1">
            Track certifications, clearances, and training requirements.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button className="gradient-primary">
            <Upload className="h-4 w-4 mr-2" />
            Upload Certificate
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-interactive">
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
        <Card className="card-interactive">
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
        <Card className="card-interactive">
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
        <Card className="card-interactive">
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

      {/* Compliance Rate */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Overall Compliance Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={complianceRate} className="flex-1 h-3" />
            <span className="text-2xl font-bold text-primary">{complianceRate}%</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {stats.compliant} of {mockEmployees.length} employees have all required certifications up to date
          </p>
        </CardContent>
      </Card>

      {/* Certifications Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">Certifications & Clearances</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search certifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="expiring" className="text-warning">
                Expiring ({filteredCertifications.filter((c) => c.status === 'expiring').length})
              </TabsTrigger>
              <TabsTrigger value="expired" className="text-destructive">
                Expired ({filteredCertifications.filter((c) => c.status === 'expired').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <CertificationsTable certifications={filteredCertifications} certTypeLabels={certTypeLabels} />
            </TabsContent>
            <TabsContent value="expiring">
              <CertificationsTable
                certifications={filteredCertifications.filter((c) => c.status === 'expiring')}
                certTypeLabels={certTypeLabels}
              />
            </TabsContent>
            <TabsContent value="expired">
              <CertificationsTable
                certifications={filteredCertifications.filter((c) => c.status === 'expired')}
                certTypeLabels={certTypeLabels}
              />
            </TabsContent>
          </Tabs>
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
  status: string;
  employeeId: string;
  employeeName: string;
  employeeInitials: string;
}

function CertificationsTable({
  certifications,
  certTypeLabels,
}: {
  certifications: CertificationWithEmployee[];
  certTypeLabels: Record<string, string>;
}) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Employee</TableHead>
            <TableHead>Certification</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {certifications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No certifications found
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
                  <TableCell>{cert.name}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {certTypeLabels[cert.type] || cert.type}
                    </span>
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
                    <StatusBadge status={cert.status as any} size="sm" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      {cert.status === 'expired' || cert.status === 'expiring' ? 'Update' : 'View'}
                    </Button>
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
