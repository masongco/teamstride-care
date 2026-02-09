import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Star, 
  Target, 
  Users, 
  FileText, 
  Plus,
  Send,
  Loader2,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { usePerformanceReviews, useCompetencies, useReviewFeedback } from '@/hooks/usePerformance';
import type { PerformanceReview, ReviewStatus } from '@/types/performance';
import { Request360FeedbackDialog } from './Request360FeedbackDialog';

interface ReviewDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: PerformanceReview;
}

const statusConfig: Record<ReviewStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In Progress', color: 'bg-primary/10 text-primary' },
  pending_approval: { label: 'Pending Approval', color: 'bg-warning/10 text-warning' },
  completed: { label: 'Completed', color: 'bg-success/10 text-success' },
};

export function ReviewDetailSheet({ open, onOpenChange, review }: ReviewDetailSheetProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [overallFeedback, setOverallFeedback] = useState(review.overall_feedback || '');
  const [strengths, setStrengths] = useState(review.strengths || '');
  const [improvements, setImprovements] = useState(review.areas_for_improvement || '');
  const [developmentPlan, setDevelopmentPlan] = useState(review.development_plan || '');

  const { updateReview } = usePerformanceReviews();
  const { competencies } = useCompetencies();
  const { feedback } = useReviewFeedback(review.id);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateReview(review.id, {
        overall_feedback: overallFeedback || null,
        strengths: strengths || null,
        areas_for_improvement: improvements || null,
        development_plan: developmentPlan || null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const pendingFeedback = feedback.filter(f => (f.status ?? 'pending') === 'pending').length;
  const submittedFeedback = feedback.filter(f => (f.status ?? 'pending') === 'submitted').length;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  {review.employee_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <SheetTitle className="flex items-center gap-2">
                  {review.employee_name}
                  <Badge className={statusConfig[review.status].color}>
                    {statusConfig[review.status].label}
                  </Badge>
                </SheetTitle>
                <SheetDescription>
                  {review.employee_position || 'No position'} • {review.employee_department || 'No department'}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Review Info */}
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Review Period</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(review.review_period_start), 'MMM yyyy')} - {format(new Date(review.review_period_end), 'MMM yyyy')}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reviewer</span>
                    <p className="mt-1 font-medium">{review.reviewer_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type</span>
                    <p className="mt-1 font-medium capitalize">{review.review_type} Review</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Overall Rating</span>
                    <div className="flex items-center gap-1 mt-1">
                      {review.overall_rating ? (
                        <>
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{review.overall_rating.toFixed(1)} / 5.0</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Not rated</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="competencies" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Competencies
                </TabsTrigger>
                <TabsTrigger value="feedback" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  360 Feedback
                  {pendingFeedback > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {pendingFeedback}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Overall Feedback</Label>
                    <Textarea
                      placeholder="Provide overall feedback for this review period..."
                      value={overallFeedback}
                      onChange={(e) => setOverallFeedback(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Strengths</Label>
                    <Textarea
                      placeholder="Key strengths demonstrated..."
                      value={strengths}
                      onChange={(e) => setStrengths(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Areas for Improvement</Label>
                    <Textarea
                      placeholder="Areas that need improvement..."
                      value={improvements}
                      onChange={(e) => setImprovements(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Development Plan</Label>
                    <Textarea
                      placeholder="Outline the development plan for the next period..."
                      value={developmentPlan}
                      onChange={(e) => setDevelopmentPlan(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <Button onClick={handleSave} disabled={isSaving} className="w-full">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Feedback
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="competencies" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Competency Framework</CardTitle>
                    <CardDescription>
                      Rate the employee on each competency area
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {competencies.map((comp) => (
                      <div key={comp.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{comp.name}</p>
                            <p className="text-xs text-muted-foreground">{comp.description}</p>
                          </div>
                          <Badge variant="outline">{comp.category}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Button
                              key={rating}
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              {rating}
                            </Button>
                          ))}
                        </div>
                        <Separator />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="feedback" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">360 Feedback Requests</CardTitle>
                      <CardDescription>
                        {submittedFeedback} of {feedback.length} responses received
                      </CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setFeedbackDialogOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Request Feedback
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {feedback.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No feedback requests yet</p>
                        <p className="text-xs mt-1">Request 360 feedback from peers, managers, or direct reports</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {feedback.map((fb) => {
                          const status = fb.status ?? 'pending';
                          return (
                          <div key={fb.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {fb.responder_name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{fb.responder_name}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {fb.feedback_type.replace('_', ' ')} • {fb.relationship_to_employee || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <Badge variant={status === 'submitted' ? 'default' : 'secondary'}>
                              {status === 'submitted' ? 'Received' : 'Pending'}
                            </Badge>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      <Request360FeedbackDialog
        open={feedbackDialogOpen}
        onOpenChange={setFeedbackDialogOpen}
        reviewId={review.id}
      />
    </>
  );
}
