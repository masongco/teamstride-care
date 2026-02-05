import { useEffect, useMemo, useState } from 'react';
import { Users, ShieldCheck, Calendar, Clock, AlertTriangle, TrendingUp, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MetricCard } from '@/components/ui/metric-card';
import { ComplianceAlerts } from '@/components/dashboard/ComplianceAlerts';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { LeaveOverview } from '@/components/dashboard/LeaveOverview';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';
import { useLeave } from '@/hooks/useLeave';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Dashboard() {
  const { user } = useAuth();
  const { isAdmin, isEmployee, isPlatformAdmin, loading: roleLoading } = useUserRole();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string>('');
  const [userName, setUserName] = useState<string>('there');
  const [orgLoading, setOrgLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const displayName =
      user.user_metadata?.display_name ||
      user.email?.split('@')[0] ||
      'there';
    setUserName(displayName);
  }, [user]);

  useEffect(() => {
    const fetchOrganisation = async () => {
      if (!user) {
        setOrgId(null);
        setOrgName('');
        setOrgLoading(false);
        return;
      }

      setOrgLoading(true);
      const { data, error } = await supabase.rpc('get_user_organisation_id', {
        _user_id: user.id,
      });

      if (error || !data) {
        setOrgId(null);
        setOrgName('');
        setOrgLoading(false);
        return;
      }

      setOrgId(data);
      const { data: orgData } = await supabase
        .from('organisations')
        .select('legal_name, trading_name')
        .eq('id', data)
        .maybeSingle();

      const name = orgData?.trading_name || orgData?.legal_name || '';
      setOrgName(name);
      setOrgLoading(false);
    };

    fetchOrganisation();
  }, [user]);

  const {
    employees,
    activeEmployees,
    certifications,
    getCertificationsForEmployee,
    isLoading: employeesLoading,
  } = useSupabaseEmployees(orgId ?? undefined, { skipFallback: true });
  const { stats: leaveStats, isLoading: leaveLoading } = useLeave(
    orgId ?? undefined,
    { skipFallback: true },
  );

  const complianceStats = useMemo(() => {
    if (!orgId) {
      return {
        alerts: 0,
        compliantEmployees: 0,
        totalEmployees: 0,
        percent: 100,
        needsAttention: 0,
      };
    }

    const activeIds = new Set(activeEmployees.map((e) => e.id));
    const relevantCerts = certifications.filter((c) =>
      activeIds.has(c.employee_id),
    );
    const alerts = relevantCerts.filter(
      (c) => c.status === 'expired' || c.status === 'expiring',
    ).length;

    const needsAttention = activeEmployees.filter((employee) => {
      const certs = getCertificationsForEmployee(employee.id);
      return certs.some(
        (cert) => cert.status === 'expired' || cert.status === 'expiring',
      );
    }).length;

    const totalEmployees = activeEmployees.length;
    const compliantEmployees = Math.max(totalEmployees - needsAttention, 0);
    const percent =
      totalEmployees === 0
        ? 100
        : Math.round((compliantEmployees / totalEmployees) * 100);

    return {
      alerts,
      compliantEmployees,
      totalEmployees,
      percent,
      needsAttention,
    };
  }, [activeEmployees, certifications, getCertificationsForEmployee, orgId]);

  const loading = roleLoading || orgLoading || employeesLoading || leaveLoading;
  const hasOrgContext = Boolean(orgId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Clock className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {userName}</h1>
          <p className="text-muted-foreground mt-1">
            {hasOrgContext && orgName
              ? `Here's what's happening at ${orgName} today.`
              : 'Select an organisation to view your dashboard.'}
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-AU', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>

      {!hasOrgContext ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              {isPlatformAdmin
                ? 'Select an organisation in Settings to view metrics.'
                : 'You’re not assigned to an organisation yet.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {isAdmin || isPlatformAdmin ? (
                <Button asChild size="sm">
                  <Link to="/settings">Go to Settings</Link>
                </Button>
              ) : isEmployee ? (
                <span className="text-xs text-muted-foreground">
                  Contact your administrator for access.
                </span>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Employees"
              value={employees.length}
              description="All team members"
              icon={Users}
              variant="default"
            />
            <MetricCard
              title="Active Employees"
              value={activeEmployees.length}
              description="Currently active"
              icon={Clock}
              variant="success"
            />
            <MetricCard
              title="Pending Leave"
              value={leaveStats.pending}
              description="Awaiting approval"
              icon={Calendar}
              variant="info"
            />
            <MetricCard
              title="Compliance Alerts"
              value={complianceStats.alerts}
              description="Require attention"
              icon={AlertTriangle}
              variant={complianceStats.alerts > 0 ? 'warning' : 'success'}
            />
          </div>

          {/* Quick Actions */}
          <QuickActions />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Compliance Alerts - Takes 1 column */}
            <div className="lg:col-span-1">
              <ComplianceAlerts organisationId={orgId ?? undefined} />
            </div>

            {/* Leave Overview - Takes 1 column */}
            <div className="lg:col-span-1">
              <LeaveOverview organisationId={orgId ?? undefined} />
            </div>

            {/* Recent Activity - Takes 1 column */}
            <div className="lg:col-span-1">
              <RecentActivity organisationId={orgId ?? undefined} />
            </div>
          </div>

          {/* Compliance Summary Bar */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <ShieldCheck className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold">Team Compliance Overview</h3>
                  <p className="text-sm text-muted-foreground">
                    {complianceStats.compliantEmployees} of{' '}
                    {complianceStats.totalEmployees} employees fully compliant
                  </p>
                </div>
              </div>
              
              <div className="flex-1 max-w-md">
                <div className="compliance-bar">
                  <div 
                    className="compliance-bar-fill bg-success" 
                    style={{ width: `${complianceStats.percent}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{complianceStats.percent}% Compliant</span>
                  <span>{complianceStats.needsAttention} need attention</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-success font-medium">On track</span>
                <span className="text-muted-foreground">this month</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
