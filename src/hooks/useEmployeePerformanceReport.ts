import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  PerformanceReview, 
  ReviewGoal, 
  CompetencyRating,
  ReviewFeedback,
  Competency 
} from '@/types/performance';

export interface EmployeePerformanceData {
  reviews: PerformanceReview[];
  goals: ReviewGoal[];
  competencyRatings: (CompetencyRating & { competency: Competency })[];
  feedback: ReviewFeedback[];
  summary: {
    totalReviews: number;
    averageRating: number;
    completedGoals: number;
    totalGoals: number;
    averageCompetencyScore: number;
  };
}

export function useEmployeePerformanceReport() {
  const [data, setData] = useState<EmployeePerformanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchEmployeeReport = useCallback(async (employeeEmail: string) => {
    try {
      setLoading(true);

      // Fetch all reviews for the employee
      const { data: reviews, error: reviewsError } = await supabase
        .from('performance_reviews')
        .select('*')
        .eq('employee_email', employeeEmail)
        .order('review_period_end', { ascending: false });

      if (reviewsError) throw reviewsError;

      const reviewIds = reviews?.map(r => r.id) || [];

      // Fetch goals, ratings, and feedback in parallel
      const [goalsResult, ratingsResult, feedbackResult, competenciesResult] = await Promise.all([
        reviewIds.length > 0
          ? supabase
              .from('review_goals')
              .select('*')
              .in('review_id', reviewIds)
          : Promise.resolve({ data: [], error: null }),
        reviewIds.length > 0
          ? supabase
              .from('competency_ratings')
              .select('*')
              .in('review_id', reviewIds)
          : Promise.resolve({ data: [], error: null }),
        reviewIds.length > 0
          ? supabase
              .from('review_feedback')
              .select('*')
              .in('review_id', reviewIds)
              .eq('status', 'submitted')
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from('competencies')
          .select('*')
          .eq('is_active', true),
      ]);

      if (goalsResult.error) throw goalsResult.error;
      if (ratingsResult.error) throw ratingsResult.error;
      if (feedbackResult.error) throw feedbackResult.error;
      if (competenciesResult.error) throw competenciesResult.error;

      const goals = goalsResult.data || [];
      const ratings = ratingsResult.data || [];
      const feedback = feedbackResult.data || [];
      const competencies = competenciesResult.data || [];

      // Merge competency data with ratings
      const competencyRatings = ratings.map(r => ({
        ...r,
        competency: competencies.find(c => c.id === r.competency_id) as Competency,
      })).filter(r => r.competency);

      // Calculate summary
      const reviewsWithRating = reviews?.filter(r => r.overall_rating) || [];
      const averageRating = reviewsWithRating.length > 0
        ? reviewsWithRating.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / reviewsWithRating.length
        : 0;

      const completedGoals = goals.filter(g => g.status === 'completed').length;
      
      const ratingsWithScore = competencyRatings.filter(r => r.rating);
      const averageCompetencyScore = ratingsWithScore.length > 0
        ? ratingsWithScore.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingsWithScore.length
        : 0;

      setData({
        reviews: reviews || [],
        goals,
        competencyRatings,
        feedback: feedback as ReviewFeedback[],
        summary: {
          totalReviews: reviews?.length || 0,
          averageRating: Number(averageRating.toFixed(2)),
          completedGoals,
          totalGoals: goals.length,
          averageCompetencyScore: Number(averageCompetencyScore.toFixed(2)),
        },
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Error fetching performance report',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const clearData = useCallback(() => {
    setData(null);
  }, []);

  return { data, loading, fetchEmployeeReport, clearData };
}
