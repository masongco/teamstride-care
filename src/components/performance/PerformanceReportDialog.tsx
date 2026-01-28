import { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useEmployeePerformanceReport } from '@/hooks/useEmployeePerformanceReport';
import { Printer, Download, Star, Target, TrendingUp, CheckCircle, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';

interface PerformanceReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  employeeEmail: string;
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-success/10 text-success',
  in_progress: 'bg-info/10 text-info',
  not_started: 'bg-muted text-muted-foreground',
  deferred: 'bg-warning/10 text-warning',
};

const REVIEW_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  in_progress: 'bg-info/10 text-info',
  pending_approval: 'bg-warning/10 text-warning',
  completed: 'bg-success/10 text-success',
};

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'fill-warning text-warning' : 'text-muted'}`}
        />
      ))}
      <span className="ml-2 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

export function PerformanceReportDialog({
  open,
  onOpenChange,
  employeeName,
  employeeEmail,
}: PerformanceReportDialogProps) {
  const { data, loading, fetchEmployeeReport, clearData } = useEmployeePerformanceReport();
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && employeeEmail) {
      fetchEmployeeReport(employeeEmail);
    } else {
      clearData();
    }
  }, [open, employeeEmail, fetchEmployeeReport, clearData]);

  const handlePrint = () => {
    window.print();
  };

  // Group competency ratings by category
  const ratingsByCategory = data?.competencyRatings.reduce((acc, rating) => {
    const category = rating.competency.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(rating);
    return acc;
  }, {} as Record<string, typeof data.competencyRatings>) || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible">
        <DialogHeader className="print:hidden">
          <DialogTitle>Performance Report</DialogTitle>
          <DialogDescription>
            Comprehensive performance summary for {employeeName}
          </DialogDescription>
        </DialogHeader>

        {/* Print Actions */}
        <div className="flex gap-2 print:hidden">
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        ) : data ? (
          <div ref={reportRef} className="print-report space-y-6">
            {/* Report Header */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 print:bg-none print:border print:border-border">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{employeeName}</h1>
                  <p className="text-muted-foreground">{employeeEmail}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Report generated: {format(new Date(), 'dd MMMM yyyy')}
                  </p>
                </div>
                <div className="text-right hidden print:block">
                  <p className="font-semibold">Social Plus Support Work</p>
                  <p className="text-sm text-muted-foreground">Performance Report</p>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="bg-background rounded-lg p-3 border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="h-4 w-4" />
                    Total Reviews
                  </div>
                  <p className="text-2xl font-bold mt-1">{data.summary.totalReviews}</p>
                </div>
                <div className="bg-background rounded-lg p-3 border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4" />
                    Avg Rating
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {data.summary.averageRating > 0 ? data.summary.averageRating.toFixed(1) : '—'}
                  </p>
                </div>
                <div className="bg-background rounded-lg p-3 border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4" />
                    Goals Completed
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {data.summary.completedGoals}/{data.summary.totalGoals}
                  </p>
                </div>
                <div className="bg-background rounded-lg p-3 border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    Competency Score
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {data.summary.averageCompetencyScore > 0 ? data.summary.averageCompetencyScore.toFixed(1) : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <section className="print:break-inside-avoid">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-primary" />
                Performance Reviews
              </h2>
              {data.reviews.length > 0 ? (
                <div className="space-y-4">
                  {data.reviews.map(review => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {review.review_type}
                            </Badge>
                            <Badge className={REVIEW_STATUS_COLORS[review.status]}>
                              {review.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Period: {format(new Date(review.review_period_start), 'MMM yyyy')} -{' '}
                            {format(new Date(review.review_period_end), 'MMM yyyy')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Reviewer: {review.reviewer_name}
                          </p>
                        </div>
                        {review.overall_rating && (
                          <RatingStars rating={review.overall_rating} />
                        )}
                      </div>

                      {(review.strengths || review.areas_for_improvement) && (
                        <div className="grid sm:grid-cols-2 gap-4 mt-4">
                          {review.strengths && (
                            <div>
                              <p className="text-sm font-medium text-success mb-1">Strengths</p>
                              <p className="text-sm text-muted-foreground">{review.strengths}</p>
                            </div>
                          )}
                          {review.areas_for_improvement && (
                            <div>
                              <p className="text-sm font-medium text-warning mb-1">Areas for Improvement</p>
                              <p className="text-sm text-muted-foreground">{review.areas_for_improvement}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {review.overall_feedback && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-1">Overall Feedback</p>
                          <p className="text-sm text-muted-foreground">{review.overall_feedback}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No performance reviews on record.</p>
              )}
            </section>

            <Separator className="print:hidden" />

            {/* Competency Scores Section */}
            <section className="print:break-inside-avoid">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                Competency Scores
              </h2>
              {Object.keys(ratingsByCategory).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(ratingsByCategory).map(([category, ratings]) => (
                    <div key={category}>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">{category}</h3>
                      <div className="space-y-3">
                        {ratings.map(rating => (
                          <div key={rating.id} className="flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {rating.competency.name}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="w-24 bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${((rating.rating || 0) / 5) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium w-8 text-right">
                                {rating.rating ? rating.rating.toFixed(1) : '—'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No competency ratings recorded.</p>
              )}
            </section>

            <Separator className="print:hidden" />

            {/* Goals Section */}
            <section className="print:break-inside-avoid">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-primary" />
                Goals & Objectives
              </h2>
              {data.goals.length > 0 ? (
                <div className="space-y-3">
                  {data.goals.map(goal => (
                    <div key={goal.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{goal.title}</p>
                            <Badge className={STATUS_COLORS[goal.status || 'not_started']}>
                              {(goal.status || 'not_started').replace('_', ' ')}
                            </Badge>
                          </div>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                          )}
                          {goal.target_date && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Target: {format(new Date(goal.target_date), 'dd MMM yyyy')}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-medium">{goal.progress_percentage || 0}%</p>
                        </div>
                      </div>
                      <Progress value={goal.progress_percentage || 0} className="mt-3 h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No goals assigned.</p>
              )}
            </section>

            {/* 360 Feedback Summary */}
            {data.feedback.length > 0 && (
              <>
                <Separator className="print:hidden" />
                <section className="print:break-inside-avoid">
                  <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-primary" />
                    360° Feedback Summary
                  </h2>
                  <div className="space-y-3">
                    {data.feedback.map(fb => (
                      <div key={fb.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="capitalize">
                                {fb.feedback_type.replace('_', ' ')}
                              </Badge>
                              {!fb.is_anonymous && (
                                <span className="text-sm text-muted-foreground">
                                  from {fb.responder_name}
                                </span>
                              )}
                            </div>
                            {fb.submitted_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Submitted: {format(new Date(fb.submitted_at), 'dd MMM yyyy')}
                              </p>
                            )}
                          </div>
                          {fb.overall_rating && <RatingStars rating={fb.overall_rating} />}
                        </div>

                        {(fb.strengths || fb.areas_for_improvement) && (
                          <div className="grid sm:grid-cols-2 gap-4 mt-3">
                            {fb.strengths && (
                              <div>
                                <p className="text-sm font-medium text-success mb-1">Strengths</p>
                                <p className="text-sm text-muted-foreground">{fb.strengths}</p>
                              </div>
                            )}
                            {fb.areas_for_improvement && (
                              <div>
                                <p className="text-sm font-medium text-warning mb-1">Areas for Improvement</p>
                                <p className="text-sm text-muted-foreground">{fb.areas_for_improvement}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {fb.additional_comments && (
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-1">Additional Comments</p>
                            <p className="text-sm text-muted-foreground">{fb.additional_comments}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Footer for print */}
            <div className="hidden print:block mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
              <p>This report was generated from Social Plus Support Work HRMS</p>
              <p>Generated on {format(new Date(), 'dd MMMM yyyy')} at {format(new Date(), 'HH:mm')}</p>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No performance data available for this employee.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
