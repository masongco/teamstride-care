import { AlertTriangle, XCircle, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';
import { format, differenceInDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface ComplianceAlert {
  employeeId: string;
  employeeName: string;
  certification: string;
  expiryDate: string;
  status: 'expired' | 'expiring';
  daysUntilExpiry: number;
}

export function ComplianceAlerts() {
  const { 
    employees, 
    certifications, 
    getCertificationsForEmployee,
    isLoading 
  } = useSupabaseEmployees();

  // Generate alerts from Supabase data
  const alerts: ComplianceAlert[] = useMemo(() => {
    return employees
      .filter((e) => e.status === 'active')
      .flatMap((employee) => {
        const empCerts = getCertificationsForEmployee(employee.id);
        return empCerts
          .filter((cert) => cert.status === 'expired' || cert.status === 'expiring')
          .map((cert) => ({
            employeeId: employee.id,
            employeeName: `${employee.first_name} ${employee.last_name}`,
            certification: cert.name,
            expiryDate: cert.expiry_date || '',
            status: cert.status as 'expired' | 'expiring',
            daysUntilExpiry: cert.expiry_date 
              ? differenceInDays(parseISO(cert.expiry_date), new Date())
              : 0,
          }));
      })
      // Sort by urgency (expired first, then by days until expiry)
      .sort((a, b) => {
        if (a.status === 'expired' && b.status !== 'expired') return -1;
        if (a.status !== 'expired' && b.status === 'expired') return 1;
        return a.daysUntilExpiry - b.daysUntilExpiry;
      });
  }, [employees, getCertificationsForEmployee]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Compliance Alerts</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

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
