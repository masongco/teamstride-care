import { useState } from 'react';
import { 
  Mail, Phone, FileText, Star, Calendar, Clock, 
  ChevronRight, Send, Download, Plus, X 
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
import { Applicant, ApplicantStage } from '@/types/recruitment';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface ApplicantDetailSheetProps {
  applicant: Applicant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoveStage?: (applicant: Applicant, stage: ApplicantStage) => void;
}

const stageFlow: ApplicantStage[] = [
  'applied', 'screening', 'interview', 'reference_check', 'offer', 'hired'
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
  onMoveStage 
}: ApplicantDetailSheetProps) {
  const [note, setNote] = useState('');

  if (!applicant) return null;

  const currentStageIndex = stageFlow.indexOf(applicant.stage);
  const nextStage = currentStageIndex >= 0 && currentStageIndex < stageFlow.length - 1
    ? stageFlow[currentStageIndex + 1]
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {applicant.firstName[0]}{applicant.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-xl">
                {applicant.firstName} {applicant.lastName}
              </SheetTitle>
              <SheetDescription className="mt-1">
                {applicant.jobTitle}
              </SheetDescription>
              <Badge className={cn('mt-2', stageColors[applicant.stage])}>
                {stageLabels[applicant.stage]}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        {/* Contact Info */}
        <div className="space-y-3 py-4 border-t border-b border-border">
          <a 
            href={`mailto:${applicant.email}`}
            className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
          >
            <Mail className="h-4 w-4 text-muted-foreground" />
            {applicant.email}
          </a>
          <a 
            href={`tel:${applicant.phone}`}
            className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
          >
            <Phone className="h-4 w-4 text-muted-foreground" />
            {applicant.phone}
          </a>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Applied {format(parseISO(applicant.appliedAt), 'MMMM d, yyyy')}
          </div>
        </div>

        {/* Rating */}
        <div className="py-4">
          <p className="text-sm font-medium mb-2">Rating</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} className="p-1 hover:scale-110 transition-transform">
                <Star
                  className={cn(
                    'h-5 w-5',
                    star <= applicant.rating
                      ? 'fill-warning text-warning'
                      : 'text-muted hover:text-warning/50'
                  )}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">
              {applicant.rating > 0 ? `${applicant.rating}/5` : 'Not rated'}
            </span>
          </div>
        </div>

        {/* Stage Progress */}
        <div className="py-4">
          <p className="text-sm font-medium mb-3">Hiring Progress</p>
          <div className="flex items-center gap-1">
            {stageFlow.slice(0, -1).map((stage, index) => {
              const isActive = stageFlow.indexOf(applicant.stage) >= index;
              const isCurrent = applicant.stage === stage;
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
          {nextStage && applicant.stage !== 'rejected' && (
            <Button 
              className="flex-1 gradient-primary"
              onClick={() => onMoveStage?.(applicant, nextStage)}
            >
              Move to {stageLabels[nextStage]}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {applicant.stage === 'offer' && (
            <Button className="flex-1 gradient-primary">
              <Send className="h-4 w-4 mr-2" />
              Send Offer Letter
            </Button>
          )}
          {applicant.stage !== 'rejected' && applicant.stage !== 'hired' && (
            <Button variant="outline" className="text-destructive">
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
          )}
        </div>

        <Separator />

        {/* Tabs */}
        <Tabs defaultValue="notes" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
            <TabsTrigger value="documents" className="flex-1">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="mt-4 space-y-4">
            {/* Add Note */}
            <div className="space-y-2">
              <Textarea
                placeholder="Add a note about this candidate..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[80px]"
              />
              <Button size="sm" disabled={!note.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                Add Note
              </Button>
            </div>

            {/* Notes List */}
            <div className="space-y-3">
              {applicant.notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No notes yet
                </p>
              ) : (
                applicant.notes.map((note) => (
                  <div key={note.id} className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm">{note.content}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span className="font-medium">{note.author}</span>
                      <span>•</span>
                      <span>{format(parseISO(note.createdAt), 'MMM d, h:mm a')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-4 space-y-2">
            {applicant.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No documents uploaded
              </p>
            ) : (
              applicant.documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded {format(parseISO(doc.uploadedAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
            <Button variant="outline" className="w-full mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
