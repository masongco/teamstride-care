import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ClipboardCheck, 
  Star, 
  Target, 
  Calendar, 
  User,
  ChevronRight,
  CheckCircle,
  Clock,
  FileText,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { useEmployeeReviews } from '@/hooks/useEmployeeReviews';
import { ReviewDetailSheet } from '@/components/portal/ReviewDetailSheet';
import { SelfAssessmentDialog } from '@/components/portal/SelfAssessmentDialog';
import type { PerformanceReview } from '@/types/performance';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: 'Draft', variant: 'secondary', icon: FileText },
  in_progress: { label: 'In Progress', variant: 'default', icon: Clock },
  pending_approval: { label: 'Pending Approval', variant: 'outline', icon: Clock },
  completed: { label: 'Completed', variant: 'default', icon: CheckCircle },
};

const reviewTypeLabels: Record<string, string> = {
  performance: 'Performance Review',
  annual: 'Annual Review',
  probation: 'Probation Review',
};

export default function MyReviews() {
  const { reviews, loading } = useEmployeeReviews();
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selfAssessmentOpen, setSelfAssessmentOpen] = useState(false);
  const [selfAssessmentReview, setSelfAssessmentReview] = useState<PerformanceReview | null>(null);

  const activeReviews = reviews.filter(r => r.status !== 'completed');
  const completedReviews = reviews.filter(r => r.status === 'completed');

  const handleViewDetails = (review: PerformanceReview) => {
    setSelectedReview(review);
    setDetailOpen(true);
  };

  const handleStartSelfAssessment = (review: PerformanceReview) => {
    setSelfAssessmentReview(review);
    setSelfAssessmentOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Performance Reviews</h1>
        <p className="text-muted-foreground mt-1">
          View your performance reviews and submit self-assessments
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{reviews.length}</p>
              <p className="text-sm text-muted-foreground">Total Reviews</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-lg bg-info/10">
              <Clock className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeReviews.length}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-lg bg-success/10">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedReviews.length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Active ({activeReviews.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed ({completedReviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeReviews.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">No Active Reviews</h3>
                <p className="text-muted-foreground mt-1">
                  You don't have any performance reviews in progress
                </p>
              </CardContent>
            </Card>
          ) : (
            activeReviews.map(review => (
              <ReviewCard 
                key={review.id} 
                review={review} 
                onViewDetails={handleViewDetails}
                onStartSelfAssessment={handleStartSelfAssessment}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedReviews.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">No Completed Reviews</h3>
                <p className="text-muted-foreground mt-1">
                  Your completed performance reviews will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            completedReviews.map(review => (
              <ReviewCard 
                key={review.id} 
                review={review} 
                onViewDetails={handleViewDetails}
                onStartSelfAssessment={handleStartSelfAssessment}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Sheet */}
      {selectedReview && (
        <ReviewDetailSheet 
          review={selectedReview} 
          open={detailOpen} 
          onOpenChange={setDetailOpen}
          onStartSelfAssessment={() => {
            setDetailOpen(false);
            handleStartSelfAssessment(selectedReview);
          }}
        />
      )}

      {/* Self-Assessment Dialog */}
      {selfAssessmentReview && (
        <SelfAssessmentDialog 
          review={selfAssessmentReview}
          open={selfAssessmentOpen}
          onOpenChange={setSelfAssessmentOpen}
        />
      )}
    </div>
  );
}

function ReviewCard({ 
  review, 
  onViewDetails,
  onStartSelfAssessment
}: { 
  review: PerformanceReview; 
  onViewDetails: (review: PerformanceReview) => void;
  onStartSelfAssessment: (review: PerformanceReview) => void;
}) {
  const config = statusConfig[review.status] || statusConfig.draft;
  const StatusIcon = config.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Main Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{reviewTypeLabels[review.review_type] || review.review_type}</h3>
                  <Badge variant={config.variant} className="flex items-center gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(review.review_period_start), 'MMM d, yyyy')} - {format(new Date(review.review_period_end), 'MMM d, yyyy')}
                </p>
              </div>
              {review.overall_rating && (
                <div className="flex items-center gap-1 text-warning">
                  <Star className="h-5 w-5 fill-current" />
                  <span className="font-semibold">{review.overall_rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>Reviewer: {review.reviewer_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Created: {format(new Date(review.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>

            {review.overall_feedback && (
              <p className="text-sm line-clamp-2">{review.overall_feedback}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {review.status !== 'completed' && (
              <Button 
                variant="outline"
                onClick={() => onStartSelfAssessment(review)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Self-Assessment
              </Button>
            )}
            <Button onClick={() => onViewDetails(review)}>
              View Details
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
