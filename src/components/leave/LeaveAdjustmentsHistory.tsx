import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useLeave } from '@/hooks/useLeave';
import { TrendingUp, TrendingDown, History } from 'lucide-react';

export function LeaveAdjustmentsHistory() {
  const { adjustments, adjustmentsLoading } = useLeave();

  if (adjustmentsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Adjustment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading adjustments...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          Balance Adjustment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {adjustments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No balance adjustments have been made</p>
            <p className="text-sm mt-1">
              Adjustments will appear here when admins manually modify leave balances.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {adjustments.map((adjustment) => {
              const isPositive = adjustment.adjustment_hours > 0;
              const employee = adjustment.employee as { first_name: string; last_name: string } | undefined;
              const leaveType = adjustment.leave_type as { name: string } | undefined;

              return (
                <div
                  key={adjustment.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card"
                >
                  <div
                    className={`p-2 rounded-full ${
                      isPositive ? 'bg-success/10' : 'bg-destructive/10'
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-5 w-5 text-success" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {employee && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {employee.first_name[0]}
                              {employee.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {employee.first_name} {employee.last_name}
                          </span>
                        </div>
                      )}
                      {leaveType && (
                        <Badge variant="secondary">{leaveType.name}</Badge>
                      )}
                      <Badge
                        variant={isPositive ? 'default' : 'destructive'}
                        className="font-mono"
                      >
                        {isPositive ? '+' : ''}
                        {adjustment.adjustment_hours.toFixed(1)}h
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mt-2">
                      {adjustment.reason}
                    </p>

                    <p className="text-xs text-muted-foreground mt-2">
                      Adjusted by {adjustment.adjusted_by_name || adjustment.adjusted_by_email} on{' '}
                      {format(parseISO(adjustment.created_at), 'PPp')}
                    </p>
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
