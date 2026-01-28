import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  Supervision, 
  SupervisionSession, 
  Competency, 
  PerformanceReview,
  ReviewGoal,
  CompetencyRating,
  ReviewFeedback 
} from '@/types/performance';

export function useSupervisions() {
  const [supervisions, setSupervisions] = useState<Supervision[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSupervisions = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('supervisions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSupervisions(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching supervisions',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createSupervision = async (supervision: Omit<Supervision, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('supervisions')
        .insert(supervision)
        .select()
        .single();

      if (error) throw error;
      setSupervisions(prev => [data, ...prev]);
      toast({ title: 'Supervision relationship created' });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error creating supervision',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateSupervision = async (id: string, updates: Partial<Supervision>) => {
    try {
      const { data, error } = await supabase
        .from('supervisions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setSupervisions(prev => prev.map(s => s.id === id ? data : s));
      toast({ title: 'Supervision updated' });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error updating supervision',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteSupervision = async (id: string) => {
    try {
      const { error } = await supabase
        .from('supervisions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSupervisions(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Supervision deleted' });
      return true;
    } catch (error: any) {
      toast({
        title: 'Error deleting supervision',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchSupervisions();
  }, [fetchSupervisions]);

  return { supervisions, loading, fetchSupervisions, createSupervision, updateSupervision, deleteSupervision };
}

export function useSupervisionSessions(supervisionId?: string) {
  const [sessions, setSessions] = useState<SupervisionSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('supervision_sessions')
        .select('*')
        .order('session_date', { ascending: false });

      if (supervisionId) {
        query = query.eq('supervision_id', supervisionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching sessions',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [supervisionId, toast]);

  const createSession = async (session: Omit<SupervisionSession, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('supervision_sessions')
        .insert(session)
        .select()
        .single();

      if (error) throw error;
      setSessions(prev => [data, ...prev]);
      toast({ title: 'Session recorded' });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error creating session',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, fetchSessions, createSession };
}

export function useCompetencies() {
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCompetencies = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('competencies')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCompetencies(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching competencies',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createCompetency = async (competency: Omit<Competency, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('competencies')
        .insert(competency)
        .select()
        .single();

      if (error) throw error;
      setCompetencies(prev => [...prev, data].sort((a, b) => a.display_order - b.display_order));
      toast({ title: 'Competency created' });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error creating competency',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateCompetency = async (id: string, updates: Partial<Competency>) => {
    try {
      const { data, error } = await supabase
        .from('competencies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setCompetencies(prev => 
        prev.map(c => c.id === id ? data : c).sort((a, b) => a.display_order - b.display_order)
      );
      toast({ title: 'Competency updated' });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error updating competency',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteCompetency = async (id: string) => {
    try {
      const { error } = await supabase
        .from('competencies')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      setCompetencies(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Competency removed' });
      return true;
    } catch (error: any) {
      toast({
        title: 'Error removing competency',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchCompetencies();
  }, [fetchCompetencies]);

  return { competencies, loading, fetchCompetencies, createCompetency, updateCompetency, deleteCompetency };
}

export function usePerformanceReviews() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('performance_reviews')
        .select('*')
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

  const createReview = async (review: Omit<PerformanceReview, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('performance_reviews')
        .insert(review)
        .select()
        .single();

      if (error) throw error;
      setReviews(prev => [data, ...prev]);
      toast({ title: 'Review created' });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error creating review',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateReview = async (id: string, updates: Partial<PerformanceReview>) => {
    try {
      const { data, error } = await supabase
        .from('performance_reviews')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setReviews(prev => prev.map(r => r.id === id ? data : r));
      toast({ title: 'Review updated' });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error updating review',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteReview = async (id: string) => {
    try {
      const { error } = await supabase
        .from('performance_reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setReviews(prev => prev.filter(r => r.id !== id));
      toast({ title: 'Review deleted' });
      return true;
    } catch (error: any) {
      toast({
        title: 'Error deleting review',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { reviews, loading, fetchReviews, createReview, updateReview, deleteReview };
}

export function useReviewFeedback(reviewId?: string) {
  const [feedback, setFeedback] = useState<ReviewFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFeedback = useCallback(async () => {
    if (!reviewId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('review_feedback')
        .select('*')
        .eq('review_id', reviewId)
        .order('created_at', { ascending: false })
        .returns<ReviewFeedback[]>();

      if (error) throw error;
      setFeedback(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching feedback',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [reviewId, toast]);

  const requestFeedback = async (feedbackRequest: Omit<ReviewFeedback, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('review_feedback')
        .insert(feedbackRequest)
        .select()
        .returns<ReviewFeedback[]>()
        .single();

      if (error) throw error;
      setFeedback(prev => [data, ...prev]);
      toast({ title: 'Feedback request sent' });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error requesting feedback',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const submitFeedback = async (id: string, updates: Partial<ReviewFeedback>) => {
    try {
      const { data, error } = await supabase
        .from('review_feedback')
        .update({ ...updates, status: 'submitted' as const, submitted_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .returns<ReviewFeedback[]>()
        .single();

      if (error) throw error;
      setFeedback(prev => prev.map(f => f.id === id ? data : f));
      toast({ title: 'Feedback submitted' });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error submitting feedback',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return { feedback, loading, fetchFeedback, requestFeedback, submitFeedback };
}
