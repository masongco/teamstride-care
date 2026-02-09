import React, { useState } from 'react';
import { Search, UserX, RotateCcw, ArrowLeft, ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { EmploymentType } from '@/types/hrms';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { accessDeniedMessage } from '@/lib/errorMessages';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';
import type { EmployeeDB } from '@/types/database';

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

export default function DeactivatedStaff() {
  const { isManager, loading: roleLoading } = useUserRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');

  const {
    employees,
    isLoading,
    error,
    changeStatus,
    isChangingStatus,
  } = useSupabaseEmployees();

  // Show loading state while checking permissions or loading data
  if (roleLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show access denied if not admin or manager
  if (!isManager) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card>
          <CardContent className="py-12 text-center">
            <ShieldAlert className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground mb-4">
              {accessDeniedMessage('the deactivated staff archive')}
            </p>
            <Button variant="outline" asChild>
              <Link to="/employees">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Employees
              </Link>
            </Button>
          </CardContent>
        </Card>
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

  const deactivatedEmployees = employees.filter((employee: EmployeeDB) => {
    if (employee.status !== 'inactive') return false;
    
    const matchesSearch =
      `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.position?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    const matchesDepartment = filterDepartment === 'all' || employee.department === filterDepartment;

    return matchesSearch && matchesDepartment;
  });

  const departments = [...new Set(employees.map((e: EmployeeDB) => e.department).filter(Boolean))];

  const handleReactivate = async (employee: EmployeeDB) => {
    try {
      await changeStatus(employee.id, 'active');
    } catch (err) {
      console.error('Failed to reactivate employee:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/employees">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UserX className="h-6 w-6 text-muted-foreground" />
              Deactivated Staff
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage former employees. Admins can reactivate staff when needed.
            </p>
          </div>
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
                  <SelectItem key={dept} value={dept!}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Deactivated Employee Cards Grid */}
      {deactivatedEmployees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deactivatedEmployees.map((employee: EmployeeDB) => (
            <Card key={employee.id} className="border-dashed border-muted-foreground/30">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 opacity-60">
                      <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                        {employee.first_name[0]}
                        {employee.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-muted-foreground">
                        {employee.first_name} {employee.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground/70">{employee.position || 'No position'}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium opacity-60',
                            employmentTypeColors[employee.employment_type as EmploymentType]
                          )}
                        >
                          {employmentTypeLabels[employee.employment_type as EmploymentType]}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Department</span>
                    <span className="font-medium text-muted-foreground">{employee.department || 'Not assigned'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium text-muted-foreground truncate max-w-[180px]">
                      {employee.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
                      Deactivated
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full" disabled={isChangingStatus}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reactivate Employee
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reactivate Employee?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will restore {employee.first_name} {employee.last_name} to active status. 
                          They will appear in the main Employees list again.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleReactivate(employee)}>
                          Reactivate
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <UserX className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No Deactivated Staff</h3>
            <p className="text-muted-foreground/70 mt-1">
              {searchQuery || filterDepartment !== 'all' 
                ? 'No deactivated employees match your search criteria.'
                : 'All employees are currently active.'}
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link to="/employees">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Employees
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
