import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserPlus, Calendar, FileCheck, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'hire' | 'leave' | 'document' | 'timesheet' | 'compliance';
  title: string;
  description: string;
  time: string;
  user?: {
    name: string;
    initials: string;
  };
}

const activityIcons = {
  hire: UserPlus,
  leave: Calendar,
  document: FileCheck,
  timesheet: Clock,
  compliance: CheckCircle,
};

const activityColors = {
  hire: 'bg-success/10 text-success',
  leave: 'bg-info/10 text-info',
  document: 'bg-primary/10 text-primary',
  timesheet: 'bg-warning/10 text-warning',
  compliance: 'bg-success/10 text-success',
};

type AuditLogRow = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
  new_values: Record<string, unknown> | null;
};

function toInitials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join('') || 'NA';
}

function toActivityType(action: string): ActivityItem['type'] {
  if (action.startsWith('employee')) return 'hire';
  if (action.startsWith('leave')) return 'leave';
  if (action.startsWith('document')) return 'document';
  if (action.startsWith('timesheet')) return 'timesheet';
  if (action.startsWith('compliance')) return 'compliance';
  return 'compliance';
}

function formatActionTitle(action: string) {
  const cleaned = action.replace(/[._-]/g, ' ').trim();
  return cleaned
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function RecentActivity({ organisationId }: { organisationId?: string }) {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchLogs = async () => {
      if (!organisationId) {
        setLogs([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select(
          'id, action, entity_type, entity_id, created_at, user_name, user_email, new_values',
        )
        .eq('organisation_id', organisationId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!active) return;

      if (error) {
        console.error('[RecentActivity] Failed to fetch audit logs:', error);
        setLogs([]);
      } else {
        setLogs((data || []) as AuditLogRow[]);
      }
      setLoading(false);
    };

    fetchLogs();

    return () => {
      active = false;
    };
  }, [organisationId]);

  const activity = useMemo<ActivityItem[]>(() => {
    return logs.map((log) => {
      const userName =
        log.user_name || log.user_email || log.entity_id || 'System';
      const isEmployeeCreate = log.action === 'employee.create';
      const employeeFirstName = String(
        (log.new_values?.first_name as string | undefined) || '',
      ).trim();
      const employeeLastName = String(
        (log.new_values?.last_name as string | undefined) || '',
      ).trim();
      const employeeName = `${employeeFirstName} ${employeeLastName}`.trim();
      const employeeRole = String(
        (log.new_values?.position as string | undefined) ||
          (log.new_values?.role as string | undefined) ||
          '',
      ).trim();
      const employeeDepartment = String(
        (log.new_values?.department as string | undefined) || '',
      ).trim();

      return {
        id: log.id,
        type: toActivityType(log.action),
        title: isEmployeeCreate && employeeName
          ? `${employeeName} Joined`
          : formatActionTitle(log.action),
        description: isEmployeeCreate && (employeeRole || employeeDepartment)
          ? `${employeeRole || '—'} • ${employeeDepartment || '—'}`
          : `${log.entity_type.replace(/_/g, ' ')}${log.entity_id ? ` • ${log.entity_id}` : ''}`,
        time: formatDistanceToNow(new Date(log.created_at), {
          addSuffix: true,
        }),
        user: {
          name: isEmployeeCreate && employeeName ? employeeName : userName,
          initials: toInitials(
            isEmployeeCreate && employeeName ? employeeName : userName,
          ),
        },
      };
    });
  }, [logs]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : activity.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No recent activity yet</p>
          </div>
        ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {activity.map((activity) => {
              const Icon = activityIcons[activity.type];
              return (
                <div key={activity.id} className="relative flex gap-4 pl-2">
                  {/* Icon */}
                  <div
                    className={cn(
                      'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background',
                      activityColors[activity.type]
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activity.description}
                        </p>
                      </div>
                      {activity.user && (
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          <AvatarFallback className="text-[10px] bg-muted">
                            {activity.user.initials}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  );
}
