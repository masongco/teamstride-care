import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CompetencyScore {
  competency_id: string;
  competency_name: string;
  category: string | null;
  average_rating: number;
  total_ratings: number;
}

export interface ReviewStatusCount {
  status: string;
  count: number;
}

export interface ReviewTypeCount {
  review_type: string;
  count: number;
}

export interface MonthlyReviewTrend {
  month: string;
  completed: number;
  in_progress: number;
  pending: number;
}

export interface DepartmentPerformance {
  department: string;
  average_rating: number;
  review_count: number;
}

export function usePerformanceAnalytics() {
  const [competencyScores, setCompetencyScores] = useState<CompetencyScore[]>([]);
  const [reviewStatusCounts, setReviewStatusCounts] = useState<ReviewStatusCount[]>([]);
  const [reviewTypeCounts, setReviewTypeCounts] = useState<ReviewTypeCount[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyReviewTrend[]>([]);
  const [departmentPerformance, setDepartmentPerformance] = useState<DepartmentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCompetencyScores = useCallback(async () => {
    try {
      // Fetch competencies
      const { data: competencies, error: compError } = await supabase
        .from('competencies')
        .select('id, name, category')
        .eq('is_active', true);

      if (compError) throw compError;

      // Fetch all competency ratings
      const { data: ratings, error: ratingsError } = await supabase
        .from('competency_ratings')
        .select('competency_id, rating')
        .not('rating', 'is', null);

      if (ratingsError) throw ratingsError;

      // Calculate averages per competency
      const scoreMap = new Map<string, { sum: number; count: number }>();
      
      ratings?.forEach(r => {
        const existing = scoreMap.get(r.competency_id) || { sum: 0, count: 0 };
        existing.sum += r.rating || 0;
        existing.count += 1;
        scoreMap.set(r.competency_id, existing);
      });

      const scores: CompetencyScore[] = (competencies || []).map(c => {
        const stats = scoreMap.get(c.id) || { sum: 0, count: 0 };
        return {
          competency_id: c.id,
          competency_name: c.name,
          category: c.category,
          average_rating: stats.count > 0 ? Number((stats.sum / stats.count).toFixed(2)) : 0,
          total_ratings: stats.count,
        };
      });

      setCompetencyScores(scores);
    } catch (error: any) {
      toast({
        title: 'Error fetching competency scores',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchReviewStats = useCallback(async () => {
    try {
      const { data: reviews, error } = await supabase
        .from('performance_reviews')
        .select('status, review_type, overall_rating, employee_department, created_at, completed_at');

      if (error) throw error;

      // Status counts
      const statusMap = new Map<string, number>();
      const typeMap = new Map<string, number>();
      const departmentMap = new Map<string, { sum: number; count: number }>();

      reviews?.forEach(r => {
        // Status counts
        statusMap.set(r.status, (statusMap.get(r.status) || 0) + 1);
        
        // Type counts
        typeMap.set(r.review_type, (typeMap.get(r.review_type) || 0) + 1);
        
        // Department performance
        if (r.employee_department && r.overall_rating) {
          const existing = departmentMap.get(r.employee_department) || { sum: 0, count: 0 };
          existing.sum += r.overall_rating;
          existing.count += 1;
          departmentMap.set(r.employee_department, existing);
        }
      });

      setReviewStatusCounts(
        Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }))
      );

      setReviewTypeCounts(
        Array.from(typeMap.entries()).map(([review_type, count]) => ({ review_type, count }))
      );

      setDepartmentPerformance(
        Array.from(departmentMap.entries()).map(([department, stats]) => ({
          department,
          average_rating: Number((stats.sum / stats.count).toFixed(2)),
          review_count: stats.count,
        }))
      );

      // Monthly trends (last 6 months)
      const now = new Date();
      const monthlyData: MonthlyReviewTrend[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' });
        
        const monthReviews = reviews?.filter(r => {
          const reviewDate = new Date(r.created_at);
          return reviewDate.getMonth() === date.getMonth() && 
                 reviewDate.getFullYear() === date.getFullYear();
        }) || [];

        monthlyData.push({
          month: monthKey,
          completed: monthReviews.filter(r => r.status === 'completed').length,
          in_progress: monthReviews.filter(r => r.status === 'in_progress').length,
          pending: monthReviews.filter(r => r.status === 'pending_approval' || r.status === 'draft').length,
        });
      }

      setMonthlyTrends(monthlyData);
    } catch (error: any) {
      toast({
        title: 'Error fetching review statistics',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchCompetencyScores(), fetchReviewStats()]);
    setLoading(false);
  }, [fetchCompetencyScores, fetchReviewStats]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    competencyScores,
    reviewStatusCounts,
    reviewTypeCounts,
    monthlyTrends,
    departmentPerformance,
    loading,
    refetch: fetchAll,
  };
}
