import { AlertTriangle, XCircle, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockEmployees } from '@/lib/mock-data';
import { format, differenceInDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface ComplianceAlert {
  employeeId: string;
  employeeName: string;
  certification: string;
  expiryDate: string;
  status: 'expired' | 'expiring';
  daysUntilExpiry: number;
}

export function ComplianceAlerts() {
  // Generate alerts from mock data
  const alerts: ComplianceAlert[] = mockEmployees.flatMap((employee) =>
    employee.certifications
      .filter((cert) => cert.status === 'expired' || cert.status === 'expiring')
      .map((cert) => ({
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        certification: cert.name,
        expiryDate: cert.expiryDate,
        status: cert.status as 'expired' | 'expiring',
        daysUntilExpiry: differenceInDays(parseISO(cert.expiryDate), new Date()),
      }))
  );

  // Sort by urgency (expired first, then by days until expiry)
  alerts.sort((a, b) => {
    if (a.status === 'expired' && b.status !== 'expired') return -1;
    if (a.status !== 'expired' && b.status === 'expired') return 1;
    return a.daysUntilExpiry - b.daysUntilExpiry;
  });

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Compliance Alerts</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary">
          View All
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">All certifications are up to date!</p>
          </div>
        ) : (
          alerts.slice(0, 5).map((alert, index) => (
            <div
              key={`${alert.employeeId}-${alert.certification}-${index}`}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50',
                alert.status === 'expired' ? 'border-destructive/30 bg-destructive/5' : 'border-warning/30 bg-warning/5'
              )}
            >
              <div
                className={cn(
                  'p-2 rounded-full flex-shrink-0',
                  alert.status === 'expired' ? 'bg-destructive/10' : 'bg-warning/10'
                )}
              >
                {alert.status === 'expired' ? (
                  <XCircle className="h-4 w-4 text-destructive" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-warning" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{alert.employeeName}</p>
                <p className="text-xs text-muted-foreground truncate">{alert.certification}</p>
                <p
                  className={cn(
                    'text-xs font-medium mt-1',
                    alert.status === 'expired' ? 'text-destructive' : 'text-warning'
                  )}
                >
                  {alert.status === 'expired'
                    ? `Expired ${Math.abs(alert.daysUntilExpiry)} days ago`
                    : `Expires in ${alert.daysUntilExpiry} days`}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="flex-shrink-0">
                Resolve
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
