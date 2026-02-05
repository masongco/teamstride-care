import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { useLeave } from '@/hooks/useLeave';
import { format, parseISO } from 'date-fns';
import { ChevronRight, Check, X, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export function LeaveOverview({ organisationId }: { organisationId?: string }) {
  const navigate = useNavigate();
  const { leaveRequests, processDecision, isProcessingDecision, isLoading } = useLeave(
    organisationId,
    { skipFallback: true },
  );

  const pendingRequests = leaveRequests.filter((r) => r.status === 'pending').slice(0, 5);

  const handleApprove = (requestId: string) => {
    processDecision({
      request_id: requestId,
      action: 'approve',
    });
  };

  const handleReject = (requestId: string) => {
    processDecision({
      request_id: requestId,
      action: 'reject',
    });
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Leave Requests</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('/leave')}>
          View All
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No pending leave requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => {
              const employee = request.employee;
              if (!employee) return null;

              return (
                <div
                  key={request.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {employee.first_name[0]}
                      {employee.last_name[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">
                        {employee.first_name} {employee.last_name}
                      </p>
                      <StatusBadge status={request.status} size="sm" showIcon={false} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {request.leave_type?.name || request.type}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(parseISO(request.start_date), 'MMM d')} -{' '}
                      {format(parseISO(request.end_date), 'MMM d, yyyy')}
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
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                      onClick={() => handleApprove(request.id)}
                      disabled={isProcessingDecision}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleReject(request.id)}
                      disabled={isProcessingDecision}
                    >
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
