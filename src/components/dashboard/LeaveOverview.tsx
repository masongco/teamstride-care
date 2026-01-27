import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { mockLeaveRequests, mockEmployees } from '@/lib/mock-data';
import { format, parseISO } from 'date-fns';
import { ChevronRight, Check, X } from 'lucide-react';
import { LeaveType } from '@/types/hrms';

const leaveTypeLabels: Record<LeaveType, string> = {
  annual: 'Annual Leave',
  personal: 'Personal Leave',
  unpaid: 'Unpaid Leave',
  compassionate: 'Compassionate',
  parental: 'Parental Leave',
  other: 'Other',
};

export function LeaveOverview() {
  const pendingRequests = mockLeaveRequests.filter((r) => r.status === 'pending');

  const getEmployee = (employeeId: string) => {
    return mockEmployees.find((e) => e.id === employeeId);
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Leave Requests</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary">
          View All
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No pending leave requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => {
              const employee = getEmployee(request.employeeId);
              if (!employee) return null;

              return (
                <div
                  key={request.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {employee.firstName[0]}
                      {employee.lastName[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <StatusBadge status={request.status} size="sm" showIcon={false} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {leaveTypeLabels[request.type]}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(parseISO(request.startDate), 'MMM d')} -{' '}
                      {format(parseISO(request.endDate), 'MMM d, yyyy')}
                      <span className="mx-1.5">•</span>
                      {request.hours} hours
                    </p>
                    {request.reason && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        "{request.reason}"
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-success hover:text-success hover:bg-success/10">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
