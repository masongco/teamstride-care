import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Calendar, Star, ClipboardCheck, Loader2, Eye, Users } from 'lucide-react';
import { format } from 'date-fns';
import { usePerformanceReviews } from '@/hooks/usePerformance';
import { CreateReviewDialog } from './CreateReviewDialog';
import { ReviewDetailSheet } from './ReviewDetailSheet';
import type { PerformanceReview, ReviewStatus } from '@/types/performance';

interface ReviewsTabProps {
  searchQuery: string;
}

const statusConfig: Record<ReviewStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  in_progress: { label: 'In Progress', variant: 'default' },
  pending_approval: { label: 'Pending Approval', variant: 'outline' },
  completed: { label: 'Completed', variant: 'default' },
};

const typeLabels: Record<string, string> = {
  performance: 'Performance',
  annual: 'Annual',
  probation: 'Probation',
};

export function ReviewsTab({ searchQuery }: ReviewsTabProps) {
  const { reviews, loading, deleteReview, updateReview } = usePerformanceReviews();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filteredReviews = reviews.filter(r => 
    r.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.reviewer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewReview = (review: PerformanceReview) => {
    setSelectedReview(review);
    setDetailOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Performance Reviews</CardTitle>
            <CardDescription>
              Create and manage performance, annual, and probation reviews with 360 feedback
            </CardDescription>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Review
          </Button>
        </CardHeader>
        <CardContent>
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No performance reviews found</p>
              <p className="text-sm mt-1">Create a new review to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {review.employee_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{review.employee_name}</p>
                          <p className="text-xs text-muted-foreground">{review.employee_position || 'No position'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{typeLabels[review.review_type]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(review.review_period_start), 'MMM yyyy')} - {format(new Date(review.review_period_end), 'MMM yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{review.reviewer_name}</span>
                    </TableCell>
                    <TableCell>
                      {review.overall_rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{review.overall_rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={statusConfig[review.status].variant}
                        className={review.status === 'completed' ? 'bg-success/10 text-success' : ''}
                      >
                        {statusConfig[review.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => handleViewReview(review)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewReview(review)}>
                            <Users className="h-4 w-4 mr-2" />
                            Request 360 Feedback
                          </DropdownMenuItem>
                          {review.status === 'draft' && (
                            <DropdownMenuItem 
                              onClick={() => updateReview(review.id, { status: 'in_progress' })}
                            >
                              Start Review
                            </DropdownMenuItem>
                          )}
                          {review.status === 'in_progress' && (
                            <DropdownMenuItem 
                              onClick={() => updateReview(review.id, { status: 'pending_approval' })}
                            >
                              Submit for Approval
                            </DropdownMenuItem>
                          )}
                          {review.status === 'pending_approval' && (
                            <DropdownMenuItem 
                              onClick={() => updateReview(review.id, { 
                                status: 'completed', 
                                completed_at: new Date().toISOString() 
                              })}
                            >
                              Mark Complete
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => deleteReview(review.id)}
                            className="text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateReviewDialog open={createOpen} onOpenChange={setCreateOpen} />
      
      {selectedReview && (
        <ReviewDetailSheet 
          open={detailOpen} 
          onOpenChange={setDetailOpen}
          review={selectedReview}
        />
      )}
    </>
  );
}
