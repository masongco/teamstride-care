import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  PerformanceReview,
  ReviewGoal,
  CompetencyRating,
  ReviewFeedback 
} from '@/types/performance';

export function useEmployeeReviews() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMyReviews = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('performance_reviews')
        .select('*')
        .eq('employee_email', user.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching reviews',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMyReviews();
  }, [fetchMyReviews]);

  return { reviews, loading, refetch: fetchMyReviews };
}

export function useEmployeeReviewDetails(reviewId: string | undefined) {
  const [review, setReview] = useState<PerformanceReview | null>(null);
  const [goals, setGoals] = useState<ReviewGoal[]>([]);
  const [ratings, setRatings] = useState<CompetencyRating[]>([]);
  const [selfAssessment, setSelfAssessment] = useState<ReviewFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReviewDetails = useCallback(async () => {
    if (!reviewId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setLoading(false);
        return;
      }

      // Fetch review
      const { data: reviewData, error: reviewError } = await supabase
        .from('performance_reviews')
        .select('*')
        .eq('id', reviewId)
        .maybeSingle();

      if (reviewError) throw reviewError;
      setReview(reviewData);

      if (!reviewData) {
        setLoading(false);
        return;
      }

      // Fetch goals, ratings, and self-assessment in parallel
      const [goalsRes, ratingsRes, selfRes] = await Promise.all([
        supabase
          .from('review_goals')
          .select('*')
          .eq('review_id', reviewId)
          .order('created_at', { ascending: true }),
        supabase
          .from('competency_ratings')
          .select('*, competency:competencies(*)')
          .eq('review_id', reviewId),
        supabase
          .from('review_feedback')
          .select('*')
          .eq('review_id', reviewId)
          .eq('responder_email', user.email)
          .eq('feedback_type', 'self')
          .maybeSingle()
      ]);

      if (goalsRes.error) throw goalsRes.error;
      if (ratingsRes.error) throw ratingsRes.error;
      if (selfRes.error) throw selfRes.error;

      // Cast data to proper types
      setGoals((goalsRes.data || []) as ReviewGoal[]);
      setRatings(ratingsRes.data || []);
      const normalizedSelf = selfRes.data
        ? {
            ...selfRes.data,
            status: selfRes.data.status ?? 'pending',
            is_anonymous: selfRes.data.is_anonymous ?? false,
          }
        : null;
      setSelfAssessment(normalizedSelf as ReviewFeedback | null);
    } catch (error: any) {
      toast({
        title: 'Error fetching review details',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [reviewId, toast]);

  useEffect(() => {
    fetchReviewDetails();
  }, [fetchReviewDetails]);

  return { review, goals, ratings, selfAssessment, loading, refetch: fetchReviewDetails };
}

export function useSelfAssessment(reviewId: string | undefined) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const submitSelfAssessment = async (data: {
    overall_rating: number;
    strengths: string;
    areas_for_improvement: string;
    additional_comments?: string;
  }) => {
    if (!reviewId) return null;

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Not authenticated');

      // Check if self-assessment already exists
      const { data: existing } = await supabase
        .from('review_feedback')
        .select('id')
        .eq('review_id', reviewId)
        .eq('responder_email', user.email)
        .eq('feedback_type', 'self')
        .maybeSingle();

      if (existing) {
        // Update existing self-assessment
        const { data: updated, error } = await supabase
          .from('review_feedback')
          .update({
            overall_rating: data.overall_rating,
            strengths: data.strengths,
            areas_for_improvement: data.areas_for_improvement,
            additional_comments: data.additional_comments,
            status: 'submitted',
            submitted_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        toast({ title: 'Self-assessment updated successfully' });
        return updated;
      } else {
        // Create new self-assessment
        const displayName = user.user_metadata?.display_name || user.email.split('@')[0];
        
      const { data: created, error } = await supabase
        .from('review_feedback')
        .insert({
          review_id: reviewId,
          feedback_type: 'self' as const,
          responder_name: displayName,
          responder_email: user.email,
          relationship_to_employee: 'Self',
          overall_rating: data.overall_rating,
          strengths: data.strengths,
          areas_for_improvement: data.areas_for_improvement,
          additional_comments: data.additional_comments,
          is_anonymous: false,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

        if (error) throw error;
        toast({ title: 'Self-assessment submitted successfully' });
        return {
          ...created,
          status: created?.status ?? 'submitted',
          is_anonymous: created?.is_anonymous ?? false,
        };
      }
    } catch (error: any) {
      toast({
        title: 'Error submitting self-assessment',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return { submitSelfAssessment, submitting };
}
