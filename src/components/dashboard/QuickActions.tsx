import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, FileText, Clock, Calendar, Upload, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  variant: 'primary' | 'secondary';
}

const quickActions: QuickAction[] = [
  {
    label: 'Add Employee',
    icon: UserPlus,
    description: 'Onboard a new team member',
    variant: 'primary',
  },
  {
    label: 'Submit Timesheet',
    icon: Clock,
    description: 'Log hours for approval',
    variant: 'secondary',
  },
  {
    label: 'Request Leave',
    icon: Calendar,
    description: 'Submit a leave request',
    variant: 'secondary',
  },
  {
    label: 'Upload Document',
    icon: Upload,
    description: 'Add compliance documents',
    variant: 'secondary',
  },
  {
    label: 'Send Invite',
    icon: Send,
    description: 'Invite staff to portal',
    variant: 'secondary',
  },
  {
    label: 'Generate Report',
    icon: FileText,
    description: 'Create HR reports',
    variant: 'secondary',
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant === 'primary' ? 'default' : 'outline'}
              className={cn(
                'h-auto flex-col gap-2 py-4 px-3',
                action.variant === 'primary'
                  ? 'gradient-primary hover:opacity-90'
                  : 'hover:bg-muted/50'
              )}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
