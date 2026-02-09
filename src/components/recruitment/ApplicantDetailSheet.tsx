import { useMemo, useState } from 'react';
import {
  Mail,
  Phone,
  FileText,
  Calendar,
  ChevronRight,
  Send,
  Download,
  Plus,
  X,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
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
  organisation_id?: string;
  job_posting_id?: string;

  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;

  stage: ApplicantStage;
  source: string | null;
  notes: string | { id?: string; content: string; author?: string; createdAt?: string }[] | null;

  created_at: string;
  updated_at?: string;
};

interface ApplicantDetailSheetProps {
  applicant: ApplicantRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoveStage?: (applicant: ApplicantRow, stage: ApplicantStage) => void;
  onOpenOfferLetter?: (applicant: ApplicantRow) => void;
}

const stageFlow: Exclude<ApplicantStage, 'rejected'>[] = [
  'applied',
  'screening',
  'interview',
  'reference_check',
  'offer',
  'hired',
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

const stageColors: Record<ApplicantStage, string> = {
  applied: 'bg-muted text-muted-foreground',
  screening: 'bg-info/10 text-info',
  interview: 'bg-primary/10 text-primary',
  reference_check: 'bg-warning/10 text-warning',
  offer: 'bg-success/10 text-success',
  hired: 'bg-success text-success-foreground',
  rejected: 'bg-destructive/10 text-destructive',
};

export function ApplicantDetailSheet({
  applicant,
  open,
  onOpenChange,
  onMoveStage,
  onOpenOfferLetter,
}: ApplicantDetailSheetProps) {
  // Placeholder note composer (until you wire a notes/events table)
  const [noteDraft, setNoteDraft] = useState('');

  const initials = useMemo(() => {
    if (!applicant) return 'NA';
    const a = (applicant.first_name || ' ').trim().charAt(0);
    const b = (applicant.last_name || ' ').trim().charAt(0);
    return `${a}${b}`.toUpperCase().trim() || 'NA';
  }, [applicant]);

  const appliedLabel = useMemo(() => {
    if (!applicant?.created_at) return '';
    try {
      return format(parseISO(applicant.created_at), 'MMMM d, yyyy');
    } catch {
      return '';
    }
  }, [applicant?.created_at]);

  const nextStage = useMemo(() => {
    if (!applicant) return null;
    if (applicant.stage === 'rejected' || applicant.stage === 'hired') return null;
    const idx = stageFlow.indexOf(applicant.stage as any);
    if (idx >= 0 && idx < stageFlow.length - 1) return stageFlow[idx + 1];
    return null;
  }, [applicant]);
  const notesList = useMemo(() => {
    if (!applicant) return [];
    if (Array.isArray(applicant.notes)) return applicant.notes;
    if (typeof applicant.notes === 'string' && applicant.notes.trim()) {
      return [
        {
          id: `note-${applicant.id}`,
          content: applicant.notes,
          author: 'System',
          createdAt: applicant.created_at,
        },
      ];
    }
    return [];
  }, [applicant]);

  if (!applicant) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-xl">
                {applicant.first_name} {applicant.last_name}
              </SheetTitle>
              <SheetDescription className="mt-1">
                {applicant.source ? `Source: ${applicant.source}` : 'Applicant details'}
              </SheetDescription>
              <Badge className={cn('mt-2', stageColors[applicant.stage])}>
                {stageLabels[applicant.stage]}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        {/* Contact Info */}
        <div className="space-y-3 py-4 border-t border-b border-border">
          {applicant.email ? (
            <a
              href={`mailto:${applicant.email}`}
              className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4 text-muted-foreground" />
              {applicant.email}
            </a>
          ) : (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              —
            </div>
          )}

          {applicant.phone ? (
            <a
              href={`tel:${applicant.phone}`}
              className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4 text-muted-foreground" />
              {applicant.phone}
            </a>
          ) : (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              —
            </div>
          )}

          {appliedLabel ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Applied {appliedLabel}
            </div>
          ) : null}
        </div>

        {/* Stage Progress */}
        <div className="py-4">
          <p className="text-sm font-medium mb-3">Hiring Progress</p>
          <div className="flex items-center gap-1">
            {stageFlow.slice(0, -1).map((stage, index) => {
              const currentIndex = stageFlow.indexOf(applicant.stage as any);
              const isActive = currentIndex >= index;
              return (
                <div key={stage} className="flex items-center flex-1">
                  <div
                    className={cn(
                      'h-2 flex-1 rounded-full transition-colors',
                      isActive ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Applied</span>
            <span>Hired</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 py-4">
          {nextStage && applicant.stage !== 'rejected' ? (
            <Button
              className="flex-1 gradient-primary"
              onClick={() => onMoveStage?.(applicant, nextStage)}
            >
              Move to {stageLabels[nextStage]}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : null}

          {applicant.stage === 'offer' ? (
            <Button
              className="flex-1 gradient-primary"
              onClick={() => onOpenOfferLetter?.(applicant)}
            >
              <Send className="h-4 w-4 mr-2" />
              Offer Letter
            </Button>
          ) : null}

          {applicant.stage !== 'rejected' && applicant.stage !== 'hired' ? (
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => onMoveStage?.(applicant, 'rejected')}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
          ) : null}
        </div>

        <Separator />

        {/* Tabs */}
        <Tabs defaultValue="notes" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="notes" className="flex-1">
              Notes
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex-1">
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="mt-4 space-y-4">
            {/* Add Note (placeholder) */}
            <div className="space-y-2">
              <Textarea
                placeholder="Add a note about this candidate..."
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                className="min-h-[80px]"
              />
              <Button
                size="sm"
                disabled={!noteDraft.trim()}
                onClick={() => {
                  // Placeholder: keep note in the single text field for now.
                  // When you add a recruitment_applicant_events (or notes) table,
                  // this should INSERT and refresh.
                  setNoteDraft('');
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Note
              </Button>
            </div>

            {/* Current Notes (from applicant.notes) */}
            <div className="space-y-3">
              {notesList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
              ) : (
                notesList.map((note) => (
                  <div key={note.id ?? note.content} className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span className="font-medium">{note.author ?? 'System'}</span>
                      <span>•</span>
                      <span>{note.createdAt ? note.createdAt : 'Stored on applicant record'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-4 space-y-2">
            <p className="text-sm text-muted-foreground text-center py-4">
              No documents yet. (Wire this to storage + a documents table later.)
            </p>

            {/* Example placeholder row for future docs */}
            <div className="hidden">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Resume.pdf</p>
                  <p className="text-xs text-muted-foreground">Uploaded Jan 1, 2026</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button variant="outline" className="w-full mt-2" disabled>
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
