import { MoreHorizontal, Edit, Trash2, Eye, Pause, Play, Briefcase } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type JobStatus = 'draft' | 'active' | 'paused' | 'closed';

export type JobPostingCardJob = {
  id: string;
  title: string;
  department: string | null;
  status: JobStatus;

  // Optional/legacy fields (safe if your UI later adds them back)
  applicantCount?: number;
};

interface JobPostingCardProps {
  job: JobPostingCardJob;
  onView?: (job: JobPostingCardJob) => void;
  onEdit?: (job: JobPostingCardJob) => void;
  onToggleStatus?: (job: JobPostingCardJob) => void;
  onDelete?: (job: JobPostingCardJob) => void;
}

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  active: { label: 'Active', className: 'bg-success/10 text-success border-success/20' },
  paused: { label: 'Paused', className: 'bg-warning/10 text-warning border-warning/20' },
  closed: { label: 'Closed', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export function JobPostingCard({
  job,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: JobPostingCardProps) {
  const statusStyle = statusConfig[job.status];

  return (
    <Card className="card-interactive">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{job.title}</h3>
              <Badge variant="outline" className={cn('text-xs capitalize', statusStyle.className)}>
                {statusStyle.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {job.department?.trim() ? job.department : '—'}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover">
              <DropdownMenuItem onClick={() => onView?.(job)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(job)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Posting
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {job.status === 'active' ? (
                <DropdownMenuItem onClick={() => onToggleStatus?.(job)}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Posting
                </DropdownMenuItem>
              ) : job.status === 'paused' ? (
                <DropdownMenuItem onClick={() => onToggleStatus?.(job)}>
                  <Play className="h-4 w-4 mr-2" />
                  Resume Posting
                </DropdownMenuItem>
              ) : null}

              <DropdownMenuSeparator />

              <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(job)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Briefcase className="h-4 w-4" />
            <span>Recruitment job posting</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {typeof job.applicantCount === 'number' ? (
              <span className="font-medium">{job.applicantCount} applicants</span>
            ) : (
              <span className="font-medium">Applicants</span>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => onView?.(job)}>
            View Applicants
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
