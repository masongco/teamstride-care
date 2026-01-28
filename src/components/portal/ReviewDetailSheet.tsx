import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Star, 
  Target, 
  Calendar, 
  User,
  CheckCircle,
  Clock,
  TrendingUp,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useEmployeeReviewDetails } from '@/hooks/useEmployeeReviews';
import type { PerformanceReview } from '@/types/performance';

interface ReviewDetailSheetProps {
  review: PerformanceReview;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartSelfAssessment?: () => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In Progress', color: 'bg-info/10 text-info' },
  pending_approval: { label: 'Pending Approval', color: 'bg-warning/10 text-warning' },
  completed: { label: 'Completed', color: 'bg-success/10 text-success' },
};

const goalStatusConfig: Record<string, { label: string; color: string }> = {
  not_started: { label: 'Not Started', color: 'bg-muted' },
  in_progress: { label: 'In Progress', color: 'bg-info' },
  completed: { label: 'Completed', color: 'bg-success' },
  deferred: { label: 'Deferred', color: 'bg-warning' },
};

export function ReviewDetailSheet({ 
  review, 
  open, 
  onOpenChange,
  onStartSelfAssessment
}: ReviewDetailSheetProps) {
  const { goals, ratings, selfAssessment, loading } = useEmployeeReviewDetails(review.id);
  const config = statusConfig[review.status] || statusConfig.draft;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle className="capitalize">{review.review_type} Review</SheetTitle>
            <Badge className={config.color}>{config.label}</Badge>
          </div>
          <SheetDescription>
            Review period: {format(new Date(review.review_period_start), 'MMM d, yyyy')} - {format(new Date(review.review_period_end), 'MMM d, yyyy')}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-24" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {/* Overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Review Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Reviewer</p>
                    <p className="font-medium">{review.reviewer_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Position</p>
                    <p className="font-medium">{review.employee_position || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Department</p>
                    <p className="font-medium">{review.employee_department || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">{format(new Date(review.created_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>

                {review.overall_rating && (
                  <div className="flex items-center gap-3 pt-3 border-t">
                    <div className="flex items-center gap-1 text-warning">
                      <Star className="h-6 w-6 fill-current" />
                      <span className="text-2xl font-bold">{review.overall_rating.toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">/ 5.0 Overall Rating</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Self-Assessment Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Self-Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selfAssessment ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Submitted</span>
                      {selfAssessment.submitted_at && (
                        <span className="text-sm text-muted-foreground">
                          on {format(new Date(selfAssessment.submitted_at), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                    {selfAssessment.overall_rating && (
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-warning fill-current" />
                        <span>Self-Rating: {selfAssessment.overall_rating.toFixed(1)}/5</span>
                      </div>
                    )}
                    {selfAssessment.strengths && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Strengths</p>
                        <p className="text-sm">{selfAssessment.strengths}</p>
                      </div>
                    )}
                    {selfAssessment.areas_for_improvement && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Areas for Improvement</p>
                        <p className="text-sm">{selfAssessment.areas_for_improvement}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4 text-center">
                    <AlertCircle className="h-8 w-8 text-warning mb-2" />
                    <p className="font-medium">Self-assessment not submitted</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Share your perspective on your performance
                    </p>
                    {review.status !== 'completed' && onStartSelfAssessment && (
                      <Button onClick={onStartSelfAssessment}>
                        Start Self-Assessment
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Goals */}
            {goals.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Goals ({goals.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {goals.map(goal => {
                    const goalConfig = goalStatusConfig[goal.status] || goalStatusConfig.not_started;
                    return (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{goal.title}</p>
                            {goal.description && (
                              <p className="text-sm text-muted-foreground">{goal.description}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {goalConfig.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={goal.progress_percentage} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-10">{goal.progress_percentage}%</span>
                        </div>
                        {goal.target_date && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Target: {format(new Date(goal.target_date), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Competency Ratings */}
            {ratings.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Competency Ratings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ratings.map(rating => (
                    <div key={rating.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{rating.competency?.name || 'Unknown Competency'}</p>
                        {rating.rating && (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star 
                                key={star} 
                                className={`h-4 w-4 ${star <= rating.rating! ? 'text-warning fill-current' : 'text-muted'}`} 
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      {rating.competency?.description && (
                        <p className="text-xs text-muted-foreground">{rating.competency.description}</p>
                      )}
                      {rating.comments && (
                        <p className="text-sm bg-muted/50 p-2 rounded">{rating.comments}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Feedback Summary */}
            {review.status === 'completed' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Manager Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {review.overall_feedback && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Overall Feedback</p>
                      <p className="text-sm">{review.overall_feedback}</p>
                    </div>
                  )}
                  {review.strengths && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Strengths</p>
                      <p className="text-sm">{review.strengths}</p>
                    </div>
                  )}
                  {review.areas_for_improvement && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Areas for Improvement</p>
                      <p className="text-sm">{review.areas_for_improvement}</p>
                    </div>
                  )}
                  {review.development_plan && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Development Plan</p>
                      <p className="text-sm">{review.development_plan}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Employee Comments */}
            {review.employee_comments && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Your Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{review.employee_comments}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
