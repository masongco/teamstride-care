import { cn } from '@/lib/utils';
import { ComplianceStatus, LeaveStatus } from '@/types/hrms';
import { CheckCircle, AlertTriangle, XCircle, Clock, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: ComplianceStatus | LeaveStatus | 'active' | 'inactive' | 'onboarding' | 'offboarding';
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfig = {
  compliant: {
    label: 'Compliant',
    className: 'status-compliant',
    icon: CheckCircle,
  },
  expiring: {
    label: 'Expiring Soon',
    className: 'status-expiring',
    icon: AlertTriangle,
  },
  expired: {
    label: 'Expired',
    className: 'status-expired',
    icon: XCircle,
  },
  pending: {
    label: 'Pending',
    className: 'status-pending',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    className: 'status-compliant',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rejected',
    className: 'status-expired',
    icon: XCircle,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-muted text-muted-foreground border-muted',
    icon: XCircle,
  },
  active: {
    label: 'Active',
    className: 'status-compliant',
    icon: CheckCircle,
  },
  inactive: {
    label: 'Inactive',
    className: 'bg-muted text-muted-foreground border-muted',
    icon: HelpCircle,
  },
  onboarding: {
    label: 'Onboarding',
    className: 'status-pending',
    icon: Clock,
  },
  offboarding: {
    label: 'Offboarding',
    className: 'status-expiring',
    icon: AlertTriangle,
  },
};

export function StatusBadge({ status, showIcon = true, size = 'md', className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        config.className,
        className
      )}
    >
      {showIcon && <Icon className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />}
      {config.label}
    </span>
  );
}
