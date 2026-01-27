import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserPlus, Calendar, FileCheck, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'hire',
    title: 'New Employee Onboarded',
    description: 'Alex Nguyen joined as Specialist Support',
    time: '2 hours ago',
    user: { name: 'Alex Nguyen', initials: 'AN' },
  },
  {
    id: '2',
    type: 'leave',
    title: 'Leave Request Approved',
    description: 'Emma Thompson - Personal leave approved',
    time: '3 hours ago',
    user: { name: 'Emma Thompson', initials: 'ET' },
  },
  {
    id: '3',
    type: 'compliance',
    title: 'Certificate Uploaded',
    description: 'Sarah Mitchell uploaded First Aid Certificate',
    time: '5 hours ago',
    user: { name: 'Sarah Mitchell', initials: 'SM' },
  },
  {
    id: '4',
    type: 'timesheet',
    title: 'Timesheet Submitted',
    description: 'Michael Chen submitted weekly timesheet',
    time: '6 hours ago',
    user: { name: 'Michael Chen', initials: 'MC' },
  },
  {
    id: '5',
    type: 'document',
    title: 'Contract Signed',
    description: 'David Williams signed employment contract',
    time: '1 day ago',
    user: { name: 'David Williams', initials: 'DW' },
  },
];

export function RecentActivity() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {mockActivity.map((activity) => {
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
      </CardContent>
    </Card>
  );
}
