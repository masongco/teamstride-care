import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2 } from 'lucide-react';
import { useSelfAssessment, useEmployeeReviewDetails } from '@/hooks/useEmployeeReviews';
import type { PerformanceReview } from '@/types/performance';

interface SelfAssessmentDialogProps {
  review: PerformanceReview;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SelfAssessmentDialog({ review, open, onOpenChange }: SelfAssessmentDialogProps) {
  const { selfAssessment, refetch } = useEmployeeReviewDetails(review.id);
  const { submitSelfAssessment, submitting } = useSelfAssessment(review.id);
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [comments, setComments] = useState('');

  // Pre-fill form if self-assessment exists
  useEffect(() => {
    if (selfAssessment) {
      setRating(selfAssessment.overall_rating || 0);
      setStrengths(selfAssessment.strengths || '');
      setImprovements(selfAssessment.areas_for_improvement || '');
      setComments(selfAssessment.additional_comments || '');
    } else {
      setRating(0);
      setStrengths('');
      setImprovements('');
      setComments('');
    }
  }, [selfAssessment, open]);

  const handleSubmit = async () => {
    if (rating === 0 || !strengths.trim() || !improvements.trim()) return;

    const result = await submitSelfAssessment({
      overall_rating: rating,
      strengths: strengths.trim(),
      areas_for_improvement: improvements.trim(),
      additional_comments: comments.trim() || undefined,
    });

    if (result) {
      refetch();
      onOpenChange(false);
    }
  };

  const isValid = rating > 0 && strengths.trim().length > 0 && improvements.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Self-Assessment</DialogTitle>
          <DialogDescription>
            Reflect on your performance during this review period. Your input helps provide a complete picture of your achievements and growth areas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Overall Self-Rating *</Label>
            <p className="text-sm text-muted-foreground">How would you rate your overall performance?</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star 
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoverRating || rating) 
                        ? 'text-warning fill-current' 
                        : 'text-muted-foreground'
                    }`} 
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {rating > 0 ? `${rating}/5` : 'Select a rating'}
              </span>
            </div>
          </div>

          {/* Strengths */}
          <div className="space-y-2">
            <Label htmlFor="strengths">Key Strengths *</Label>
            <p className="text-sm text-muted-foreground">
              What do you consider your main achievements and strengths during this period?
            </p>
            <Textarea
              id="strengths"
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="Describe your key accomplishments and areas where you excelled..."
              rows={4}
            />
          </div>

          {/* Areas for Improvement */}
          <div className="space-y-2">
            <Label htmlFor="improvements">Areas for Improvement *</Label>
            <p className="text-sm text-muted-foreground">
              What areas would you like to develop or improve?
            </p>
            <Textarea
              id="improvements"
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              placeholder="Describe areas where you'd like to grow or challenges you faced..."
              rows={4}
            />
          </div>

          {/* Additional Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">Additional Comments (Optional)</Label>
            <p className="text-sm text-muted-foreground">
              Any other thoughts you'd like to share with your reviewer?
            </p>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Additional context, goals for next period, or feedback..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {selfAssessment ? 'Update Assessment' : 'Submit Assessment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
