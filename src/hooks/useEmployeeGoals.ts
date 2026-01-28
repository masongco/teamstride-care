import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completed_at?: string;
}

export interface EmployeeGoal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  target_date: string | null;
  progress_percentage: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high';
  milestones: Milestone[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalData {
  title: string;
  description?: string;
  category?: string;
  target_date?: string;
  priority?: 'low' | 'medium' | 'high';
  milestones?: Milestone[];
}

export interface UpdateGoalData {
  title?: string;
  description?: string;
  category?: string;
  target_date?: string;
  progress_percentage?: number;
  status?: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  priority?: 'low' | 'medium' | 'high';
  milestones?: Milestone[];
  notes?: string;
}

function parseMilestones(json: Json | null): Milestone[] {
  if (!json || !Array.isArray(json)) return [];
  return json.map((item) => {
    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
      return {
        id: String((item as Record<string, unknown>).id || ''),
        title: String((item as Record<string, unknown>).title || ''),
        completed: Boolean((item as Record<string, unknown>).completed),
        completed_at: (item as Record<string, unknown>).completed_at 
          ? String((item as Record<string, unknown>).completed_at) 
          : undefined,
      };
    }
    return { id: '', title: '', completed: false };
  });
}

function milestonesToJson(milestones: Milestone[]): Json {
  return milestones.map(m => ({
    id: m.id,
    title: m.title,
    completed: m.completed,
    completed_at: m.completed_at || null,
  })) as unknown as Json;
}

export function useEmployeeGoals() {
  const [goals, setGoals] = useState<EmployeeGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('employee_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGoals((data || []).map(goal => ({
        ...goal,
        milestones: parseMilestones(goal.milestones as Json),
        status: goal.status as EmployeeGoal['status'],
        priority: goal.priority as EmployeeGoal['priority'],
      })));
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load goals',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = async (goalData: CreateGoalData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('employee_goals')
        .insert({
          user_id: user.id,
          title: goalData.title,
          description: goalData.description || null,
          category: goalData.category || 'professional',
          target_date: goalData.target_date || null,
          priority: goalData.priority || 'medium',
          milestones: milestonesToJson(goalData.milestones || []),
        })
        .select()
        .single();

      if (error) throw error;

      const newGoal: EmployeeGoal = {
        ...data,
        milestones: parseMilestones(data.milestones as Json),
        status: data.status as EmployeeGoal['status'],
        priority: data.priority as EmployeeGoal['priority'],
      };

      setGoals(prev => [newGoal, ...prev]);
      toast({
        title: 'Goal Created',
        description: 'Your development goal has been created successfully.',
      });

      return newGoal;
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create goal',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateGoal = async (goalId: string, updates: UpdateGoalData) => {
    try {
      const updatePayload: Record<string, unknown> = { ...updates };
      if (updates.milestones) {
        updatePayload.milestones = milestonesToJson(updates.milestones);
      }

      const { data, error } = await supabase
        .from('employee_goals')
        .update(updatePayload)
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;

      const updatedGoal: EmployeeGoal = {
        ...data,
        milestones: parseMilestones(data.milestones as Json),
        status: data.status as EmployeeGoal['status'],
        priority: data.priority as EmployeeGoal['priority'],
      };

      setGoals(prev => prev.map(g => g.id === goalId ? updatedGoal : g));
      toast({
        title: 'Goal Updated',
        description: 'Your goal has been updated successfully.',
      });

      return updatedGoal;
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to update goal',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('employee_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      setGoals(prev => prev.filter(g => g.id !== goalId));
      toast({
        title: 'Goal Deleted',
        description: 'Your goal has been deleted.',
      });
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete goal',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const toggleMilestone = async (goalId: string, milestoneId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const updatedMilestones = goal.milestones.map(m => {
      if (m.id === milestoneId) {
        return {
          ...m,
          completed: !m.completed,
          completed_at: !m.completed ? new Date().toISOString() : undefined,
        };
      }
      return m;
    });

    const completedCount = updatedMilestones.filter(m => m.completed).length;
    const progress = updatedMilestones.length > 0 
      ? Math.round((completedCount / updatedMilestones.length) * 100)
      : goal.progress_percentage;

    await updateGoal(goalId, {
      milestones: updatedMilestones,
      progress_percentage: progress,
      status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started',
    });
  };

  return {
    goals,
    loading,
    createGoal,
    updateGoal,
    deleteGoal,
    toggleMilestone,
    refetch: fetchGoals,
  };
}
