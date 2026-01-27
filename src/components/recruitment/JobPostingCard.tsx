import { MapPin, Users, Clock, MoreHorizontal, Briefcase, DollarSign, Pause, Play, Edit, Trash2, Eye } from 'lucide-react';
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
import { JobPosting, JobStatus, EmploymentType } from '@/types/recruitment';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface JobPostingCardProps {
  job: JobPosting;
  onView?: (job: JobPosting) => void;
  onEdit?: (job: JobPosting) => void;
}

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  active: { label: 'Active', className: 'bg-success/10 text-success border-success/20' },
  paused: { label: 'Paused', className: 'bg-warning/10 text-warning border-warning/20' },
  closed: { label: 'Closed', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const employmentTypeLabels: Record<EmploymentType, string> = {
  casual: 'Casual',
  part_time: 'Part-Time',
  full_time: 'Full-Time',
  contractor: 'Contractor',
};

export function JobPostingCard({ job, onView, onEdit }: JobPostingCardProps) {
  const statusStyle = statusConfig[job.status];
  const daysUntilClose = job.closingDate 
    ? differenceInDays(parseISO(job.closingDate), new Date()) 
    : null;

  return (
    <Card className="card-interactive">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{job.title}</h3>
              <Badge variant="outline" className={cn('text-xs', statusStyle.className)}>
                {statusStyle.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{job.department}</p>
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
                <DropdownMenuItem>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Posting
                </DropdownMenuItem>
              ) : job.status === 'paused' ? (
                <DropdownMenuItem>
                  <Play className="h-4 w-4 mr-2" />
                  Resume Posting
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {job.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" />
              {employmentTypeLabels[job.employmentType]}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              ${job.payRateMin} - ${job.payRateMax}/hr
            </span>
            {job.closingDate && (
              <span className={cn(
                'flex items-center gap-1.5',
                daysUntilClose !== null && daysUntilClose < 7 ? 'text-warning' : ''
              )}>
                <Clock className="h-4 w-4" />
                {daysUntilClose !== null && daysUntilClose >= 0 
                  ? `Closes in ${daysUntilClose} days`
                  : 'Closed'}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{job.applicantCount} applicants</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => onView?.(job)}>
            View Applicants
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
