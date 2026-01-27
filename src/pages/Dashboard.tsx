import { Users, ShieldCheck, Calendar, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import { ComplianceAlerts } from '@/components/dashboard/ComplianceAlerts';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { LeaveOverview } from '@/components/dashboard/LeaveOverview';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { mockDashboardMetrics } from '@/lib/mock-data';

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, Admin</h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening at Social Plus Support Work today.
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

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Employees"
          value={mockDashboardMetrics.totalEmployees}
          description="Active team members"
          icon={Users}
          trend={{ value: 12, positive: true }}
          variant="default"
        />
        <MetricCard
          title="Active Today"
          value={mockDashboardMetrics.activeToday}
          description="Currently on shift"
          icon={Clock}
          variant="success"
        />
        <MetricCard
          title="Pending Leave"
          value={mockDashboardMetrics.pendingLeaveRequests}
          description="Awaiting approval"
          icon={Calendar}
          variant="info"
        />
        <MetricCard
          title="Compliance Alerts"
          value={mockDashboardMetrics.complianceAlerts}
          description="Require attention"
          icon={AlertTriangle}
          variant={mockDashboardMetrics.complianceAlerts > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Alerts - Takes 1 column */}
        <div className="lg:col-span-1">
          <ComplianceAlerts />
        </div>

        {/* Leave Overview - Takes 1 column */}
        <div className="lg:col-span-1">
          <LeaveOverview />
        </div>

        {/* Recent Activity - Takes 1 column */}
        <div className="lg:col-span-1">
          <RecentActivity />
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
              <p className="text-sm text-muted-foreground">4 of 6 employees fully compliant</p>
            </div>
          </div>
          
          <div className="flex-1 max-w-md">
            <div className="compliance-bar">
              <div 
                className="compliance-bar-fill bg-success" 
                style={{ width: '67%' }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>67% Compliant</span>
              <span>2 need attention</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-success font-medium">+5%</span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        </div>
      </div>
    </div>
  );
}
