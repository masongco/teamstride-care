import { useState } from 'react';
import { Calendar, Plus, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockLeaveRequests, mockEmployees } from '@/lib/mock-data';
import { format, parseISO, differenceInDays } from 'date-fns';
import { LeaveType, LeaveRequest } from '@/types/hrms';

const leaveTypeLabels: Record<LeaveType, string> = {
  annual: 'Annual Leave',
  personal: 'Personal/Sick Leave',
  unpaid: 'Unpaid Leave',
  compassionate: 'Compassionate Leave',
  parental: 'Parental Leave',
  other: 'Other',
};

const leaveTypeColors: Record<LeaveType, string> = {
  annual: 'bg-info/10 text-info',
  personal: 'bg-warning/10 text-warning',
  unpaid: 'bg-muted text-muted-foreground',
  compassionate: 'bg-primary/10 text-primary',
  parental: 'bg-success/10 text-success',
  other: 'bg-muted text-muted-foreground',
};

export default function Leave() {
  const [activeTab, setActiveTab] = useState('pending');

  const getEmployee = (employeeId: string) => {
    return mockEmployees.find((e) => e.id === employeeId);
  };

  const stats = {
    pending: mockLeaveRequests.filter((r) => r.status === 'pending').length,
    approved: mockLeaveRequests.filter((r) => r.status === 'approved').length,
    rejected: mockLeaveRequests.filter((r) => r.status === 'rejected').length,
  };

  const filteredRequests = mockLeaveRequests.filter((r) => {
    if (activeTab === 'pending') return r.status === 'pending';
    if (activeTab === 'approved') return r.status === 'approved';
    if (activeTab === 'all') return true;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground mt-1">
            Review and manage employee leave requests.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Leave Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Leave Request</DialogTitle>
              <DialogDescription>
                Fill in the details for your leave request.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="leave-type">Leave Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(leaveTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input type="date" id="start-date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input type="date" id="end-date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea id="reason" placeholder="Brief description..." />
              </div>
              <Button className="w-full gradient-primary">Submit Request</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="card-interactive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
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
                <p className="text-2xl font-bold">{stats.rejected}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pending ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="all">All Requests</TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No leave requests found</p>
                </div>
              ) : (
                filteredRequests.map((request) => {
                  const employee = getEmployee(request.employeeId);
                  if (!employee) return null;

                  const daysBetween = differenceInDays(
                    parseISO(request.endDate),
                    parseISO(request.startDate)
                  ) + 1;

                  return (
                    <div
                      key={request.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {employee.firstName[0]}
                          {employee.lastName[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${leaveTypeColors[request.type]}`}
                          >
                            {leaveTypeLabels[request.type]}
                          </span>
                          <StatusBadge status={request.status} size="sm" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(parseISO(request.startDate), 'EEE, dd MMM')} -{' '}
                          {format(parseISO(request.endDate), 'EEE, dd MMM yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {daysBetween} day{daysBetween !== 1 ? 's' : ''} • {request.hours} hours
                        </p>
                        {request.reason && (
                          <p className="text-sm text-muted-foreground mt-1 italic">
                            "{request.reason}"
                          </p>
                        )}
                      </div>

                      {request.status === 'pending' && (
                        <div className="flex gap-2 flex-shrink-0">
                          <Button size="sm" variant="outline" className="text-success border-success hover:bg-success/10">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Leave Balances Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Leave Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockEmployees.slice(0, 6).map((employee) => (
              <div
                key={employee.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {employee.firstName[0]}
                    {employee.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {employee.firstName} {employee.lastName}
                  </p>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>Annual: 80h</span>
                    <span>Personal: 40h</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
