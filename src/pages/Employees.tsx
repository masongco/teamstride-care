import React, { useState } from 'react';
import { Search, Plus, MoreHorizontal, Mail, Phone, Download, UserX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmploymentType, ComplianceStatus } from '@/types/hrms';
import { cn } from '@/lib/utils';
import { AddEmployeeDialog } from '@/components/employees/AddEmployeeDialog';
import { EmployeeDetailSheet } from '@/components/employees/EmployeeDetailSheet';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';
import type { EmployeeDB, EmploymentTypeDB, EmployeeStatusDB, ComplianceStatusDB } from '@/types/database';
import type { Employee } from '@/types/hrms';

const employmentTypeLabels: Record<EmploymentType, string> = {
  casual: 'Casual',
  part_time: 'Part-Time',
  full_time: 'Full-Time',
  contractor: 'Contractor',
};

const employmentTypeColors: Record<EmploymentType, string> = {
  casual: 'bg-info/10 text-info',
  part_time: 'bg-primary/10 text-primary',
  full_time: 'bg-success/10 text-success',
  contractor: 'bg-warning/10 text-warning',
};

// Transform database employee to legacy Employee type for compatibility with existing components
function dbToLegacyEmployee(emp: EmployeeDB): Employee {
  return {
    id: emp.id,
    firstName: emp.first_name,
    lastName: emp.last_name,
    email: emp.email,
    phone: emp.phone || '',
    avatar: emp.avatar_url || undefined,
    employmentType: emp.employment_type as EmploymentType,
    position: emp.position || '',
    department: emp.department || '',
    startDate: emp.start_date || '',
    status: emp.status as Employee['status'],
    complianceStatus: emp.compliance_status as ComplianceStatus,
    payRate: emp.pay_rate || 0,
    awardClassification: undefined,
    emergencyContact: emp.emergency_contact_name ? {
      name: emp.emergency_contact_name,
      phone: emp.emergency_contact_phone || '',
      relationship: emp.emergency_contact_relationship || '',
    } : undefined,
    documents: [],
    certifications: [],
  };
}

export default function Employees() {
  const { isManager } = useUserRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const {
    employees: dbEmployees,
    isLoading,
    error,
    createEmployee,
    updateEmployee,
    changeStatus,
    organisationId,
    isCreating,
  } = useSupabaseEmployees();

  // Convert DB employees to legacy format for UI compatibility
  const employees = dbEmployees.map(dbToLegacyEmployee);

  const filteredEmployees = employees.filter((employee) => {
    // Exclude inactive/deactivated employees from the main list
    if (employee.status === 'inactive') return false;
    
    const matchesSearch =
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = filterDepartment === 'all' || employee.department === filterDepartment;
    const matchesStatus = filterStatus === 'all' || employee.status === filterStatus;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))];

  const handleViewProfile = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDetailSheetOpen(true);
  };

  const handleUpdateEmployee = async (updatedEmployee: Employee) => {
    if (!organisationId) return;
    
    const dbEmployee = dbEmployees.find(e => e.id === updatedEmployee.id);
    if (!dbEmployee) return;

    try {
      await updateEmployee(updatedEmployee.id, {
        first_name: updatedEmployee.firstName,
        last_name: updatedEmployee.lastName,
        email: updatedEmployee.email,
        phone: updatedEmployee.phone || null,
        position: updatedEmployee.position || null,
        department: updatedEmployee.department || null,
        employment_type: updatedEmployee.employmentType as EmploymentTypeDB,
        pay_rate: updatedEmployee.payRate || null,
        status: updatedEmployee.status as EmployeeStatusDB,
        compliance_status: updatedEmployee.complianceStatus as ComplianceStatusDB,
        emergency_contact_name: updatedEmployee.emergencyContact?.name || null,
        emergency_contact_phone: updatedEmployee.emergencyContact?.phone || null,
        emergency_contact_relationship: updatedEmployee.emergencyContact?.relationship || null,
      });
      setSelectedEmployee(updatedEmployee);
    } catch (err) {
      console.error('Failed to update employee:', err);
    }
  };

  const handleDeactivateEmployee = async (employee: Employee) => {
    const newStatus = employee.status === 'inactive' ? 'active' : 'inactive';
    try {
      await changeStatus(employee.id, newStatus as EmployeeStatusDB);
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const handleAddEmployee = async (newEmployee: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    position: string;
    department: string;
    employmentType: string;
    payRate: number;
    avatar?: string;
  }) => {
    if (!organisationId) {
      toast({
        title: 'Error',
        description: 'Organisation not available. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createEmployee({
        organisation_id: organisationId,
        first_name: newEmployee.firstName,
        last_name: newEmployee.lastName,
        email: newEmployee.email,
        phone: newEmployee.phone || undefined,
        avatar_url: newEmployee.avatar || undefined,
        position: newEmployee.position || undefined,
        department: newEmployee.department || undefined,
        employment_type: newEmployee.employmentType as EmploymentTypeDB,
        pay_rate: newEmployee.payRate || undefined,
        start_date: new Date().toISOString().split('T')[0],
      });
      setAddDialogOpen(false);
    } catch (err) {
      console.error('Failed to add employee:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive">Failed to load employees. Please try again.</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-muted-foreground mt-1">
            Manage your team members and their information.
          </p>
        </div>
        <div className="flex gap-2">
          {isManager && (
            <Button variant="outline" asChild>
              <Link to="/employees/deactivated">
                <UserX className="h-4 w-4 mr-2" />
                Deactivated
              </Link>
            </Button>
          )}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button className="gradient-primary" onClick={() => setAddDialogOpen(true)} disabled={isCreating}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, email, or position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
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
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((employee) => (
          <Card 
            key={employee.id} 
            className="card-interactive cursor-pointer"
            onClick={() => handleViewProfile(employee)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 avatar-ring">
                    <AvatarImage src={employee.avatar} alt={`${employee.firstName} ${employee.lastName}`} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {employee.firstName[0]}
                      {employee.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">{employee.position}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          employmentTypeColors[employee.employmentType]
                        )}
                      >
                        {employmentTypeLabels[employee.employmentType]}
                      </span>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewProfile(employee); }}>
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Edit Details</DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>View Documents</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className={employee.status === 'inactive' ? 'text-success' : 'text-destructive'} 
                      onClick={(e) => { e.stopPropagation(); handleDeactivateEmployee(employee); }}
                    >
                      {employee.status === 'inactive' ? 'Reactivate' : 'Deactivate'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium">{employee.department || 'Not assigned'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Compliance</span>
                  <StatusBadge status={employee.complianceStatus} size="sm" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pay Rate</span>
                  <span className="font-medium">${(employee.payRate || 0).toFixed(2)}/hr</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `mailto:${employee.email}`;
                  }}
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `tel:${employee.phone}`;
                  }}
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Call
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No employees found matching your criteria.</p>
          </CardContent>
        </Card>
      )}

      {/* Add Employee Dialog */}
      <AddEmployeeDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddEmployee}
      />

      {/* Employee Detail Sheet */}
      <EmployeeDetailSheet
        employee={selectedEmployee}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onUpdate={handleUpdateEmployee}
      />
    </div>
  );
}
