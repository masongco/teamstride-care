import { ChevronRight, Mail, MoreHorizontal, User, XCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export type ApplicantStage =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'reference_check'
  | 'offer'
  | 'hired'
  | 'rejected';

export type ApplicantRow = {
  id: string;
  job_posting_id?: string;
  organisation_id?: string;

  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;

  stage: ApplicantStage;
  source: string | null;
  notes: string | { id?: string; content: string }[] | null;

  created_at: string;
  updated_at?: string;
};

export interface ApplicantPipelineProps {
  applicants: ApplicantRow[];
  onSelectApplicant?: (applicant: ApplicantRow) => void;
  onMoveApplicant?: (applicant: ApplicantRow, newStage: ApplicantStage) => void;
}

const stages: { key: Exclude<ApplicantStage, 'hired' | 'rejected'>; label: string; color: string }[] = [
  { key: 'applied', label: 'Applied', color: 'bg-muted' },
  { key: 'screening', label: 'Screening', color: 'bg-info/20' },
  { key: 'interview', label: 'Interview', color: 'bg-primary/20' },
  { key: 'reference_check', label: 'Reference Check', color: 'bg-warning/20' },
  { key: 'offer', label: 'Offer', color: 'bg-success/20' },
];

const stageLabels: Record<ApplicantStage, string> = {
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  reference_check: 'Reference Check',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
};

export function ApplicantPipeline({ applicants, onSelectApplicant, onMoveApplicant }: ApplicantPipelineProps) {
  const getApplicantsByStage = (stage: ApplicantStage) => applicants.filter((a) => a.stage === stage);

  const getNextStage = (currentStage: ApplicantStage): ApplicantStage | null => {
    const currentIndex = stages.findIndex((s) => s.key === currentStage);
    if (currentIndex >= 0 && currentIndex < stages.length - 1) {
      return stages[currentIndex + 1].key;
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stages.map((stage) => {
        const stageApplicants = getApplicantsByStage(stage.key);

        return (
          <div key={stage.key} className="space-y-3">
            <div className={cn('rounded-lg p-3', stage.color)}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{stage.label}</h3>
                <Badge variant="secondary" className="text-xs">
                  {stageApplicants.length}
                </Badge>
              </div>
            </div>

            <div className="space-y-2 min-h-[200px]">
              {stageApplicants.map((applicant) => (
                <ApplicantCard
                  key={applicant.id}
                  applicant={applicant}
                  nextStage={getNextStage(applicant.stage)}
                  onSelect={() => onSelectApplicant?.(applicant)}
                  onMove={(newStage) => onMoveApplicant?.(applicant, newStage)}
                />
              ))}

              {stageApplicants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                  No applicants
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ApplicantCardProps {
  applicant: ApplicantRow;
  nextStage: ApplicantStage | null;
  onSelect: () => void;
  onMove: (stage: ApplicantStage) => void;
}

function ApplicantCard({ applicant, nextStage, onSelect, onMove }: ApplicantCardProps) {
  const initials = `${(applicant.first_name || ' ').trim().charAt(0)}${(applicant.last_name || ' ').trim().charAt(0)}`
    .toUpperCase()
    .trim();

  const createdLabel = (() => {
    try {
      return format(parseISO(applicant.created_at), 'MMM d');
    } catch {
      return '';
    }
  })();
  const noteText = Array.isArray(applicant.notes)
    ? applicant.notes[applicant.notes.length - 1]?.content ?? ''
    : applicant.notes ?? '';

  return (
    <Card className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5" onClick={onSelect}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {initials || 'NA'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {applicant.first_name} {applicant.last_name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {applicant.email || applicant.phone || '—'}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-popover">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
              >
                <User className="h-4 w-4 mr-2" />
                View Profile
              </DropdownMenuItem>

              {applicant.email ? (
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </DropdownMenuItem>
              ) : null}

              <DropdownMenuSeparator />

              {nextStage ? (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(nextStage);
                  }}
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Move to {stageLabels[nextStage]}
                </DropdownMenuItem>
              ) : null}

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onMove('hired');
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Hired
              </DropdownMenuItem>

              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onMove('rejected');
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Applicant
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {stageLabels[applicant.stage]}
          </Badge>
          <span className="text-xs text-muted-foreground">{createdLabel}</span>
        </div>

        {noteText.trim() ? (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground line-clamp-2">{noteText}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
