import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  Course, 
  CourseModule, 
  QuizQuestion,
  CourseAssignment,
  UserCourseAssignment,
  ModuleCompletion,
  QuizAttempt,
  QuizOption
} from '@/types/portal';

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching courses',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createCourse = async (course: Omit<Course, 'id' | 'created_at' | 'updated_at' | 'modules'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('courses')
        .insert({ ...course, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      setCourses(prev => [data, ...prev]);
      toast({ title: 'Course created' });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error creating course',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateCourse = async (id: string, updates: Partial<Course>) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setCourses(prev => prev.map(c => c.id === id ? data : c));
      toast({ title: 'Course updated' });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error updating course',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteCourse = async (id: string) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      setCourses(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Course deleted' });
      return true;
    } catch (error: any) {
      toast({
        title: 'Error deleting course',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const publishCourse = async (id: string, publish: boolean) => {
    return updateCourse(id, { is_published: publish });
  };

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { courses, loading, fetchCourses, createCourse, updateCourse, deleteCourse, publishCourse };
}

export function useCourseModules(courseId?: string) {
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchModules = useCallback(async () => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setModules(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching modules',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [courseId, toast]);

  const createModule = async (module: Omit<CourseModule, 'id' | 'created_at' | 'updated_at' | 'questions'>) => {
    try {
      const { data, error } = await supabase
        .from('course_modules')
        .insert(module)
        .select()
        .single();

      if (error) throw error;
      setModules(prev => [...prev, data].sort((a, b) => a.display_order - b.display_order));
      toast({ title: 'Module created' });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error creating module',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateModule = async (id: string, updates: Partial<CourseModule>) => {
    try {
      const { data, error } = await supabase
        .from('course_modules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setModules(prev => 
        prev.map(m => m.id === id ? data : m).sort((a, b) => a.display_order - b.display_order)
      );
      toast({ title: 'Module updated' });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error updating module',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteModule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('course_modules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setModules(prev => prev.filter(m => m.id !== id));
      toast({ title: 'Module deleted' });
      return true;
    } catch (error: any) {
      toast({
        title: 'Error deleting module',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  return { modules, loading, fetchModules, createModule, updateModule, deleteModule };
}

export function useQuizQuestions(moduleId?: string) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchQuestions = useCallback(async () => {
    if (!moduleId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('module_id', moduleId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      // Parse JSONB options
      const parsed = (data || []).map(q => ({
        ...q,
        options: (q.options as unknown as QuizOption[]) || [],
      }));
      setQuestions(parsed);
    } catch (error: any) {
      toast({
        title: 'Error fetching questions',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [moduleId, toast]);

  const createQuestion = async (question: Omit<QuizQuestion, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .insert({
          ...question,
          options: question.options as any,
        })
        .select()
        .single();

      if (error) throw error;
      const parsed = { ...data, options: (data.options as unknown as QuizOption[]) || [] };
      setQuestions(prev => [...prev, parsed].sort((a, b) => a.display_order - b.display_order));
      toast({ title: 'Question created' });
      return parsed;
    } catch (error: any) {
      toast({
        title: 'Error creating question',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateQuestion = async (id: string, updates: Partial<QuizQuestion>) => {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .update({
          ...updates,
          options: updates.options as any,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const parsed = { ...data, options: (data.options as unknown as QuizOption[]) || [] };
      setQuestions(prev => 
        prev.map(q => q.id === id ? parsed : q).sort((a, b) => a.display_order - b.display_order)
      );
      toast({ title: 'Question updated' });
      return parsed;
    } catch (error: any) {
      toast({
        title: 'Error updating question',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteQuestion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setQuestions(prev => prev.filter(q => q.id !== id));
      toast({ title: 'Question deleted' });
      return true;
    } catch (error: any) {
      toast({
        title: 'Error deleting question',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return { questions, loading, fetchQuestions, createQuestion, updateQuestion, deleteQuestion };
}

export function useCourseAssignments() {
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('course_assignments')
        .select(`
          *,
          course:courses(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching assignments',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createAssignment = async (assignment: Omit<CourseAssignment, 'id' | 'created_at' | 'updated_at' | 'course'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('course_assignments')
        .insert({
          ...assignment,
          assigned_by: user?.id,
          assigned_by_name: user?.user_metadata?.display_name || user?.email,
        })
        .select(`*, course:courses(*)`)
        .single();

      if (error) throw error;
      setAssignments(prev => [data, ...prev]);
      toast({ title: 'Assignment created' });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error creating assignment',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('course_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAssignments(prev => prev.filter(a => a.id !== id));
      toast({ title: 'Assignment deleted' });
      return true;
    } catch (error: any) {
      toast({
        title: 'Error deleting assignment',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return { assignments, loading, fetchAssignments, createAssignment, deleteAssignment };
}

export function useUserCourseAssignments(userId?: string) {
  const [assignments, setAssignments] = useState<UserCourseAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        targetUserId = user?.id;
      }

      if (!targetUserId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_course_assignments')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching your training',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  const startCourse = async (assignmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_course_assignments')
        .update({ 
          status: 'in_progress' as const,
          started_at: new Date().toISOString()
        })
        .eq('id', assignmentId)
        .select(`*, course:courses(*)`)
        .single();

      if (error) throw error;
      setAssignments(prev => prev.map(a => a.id === assignmentId ? data : a));
      toast({ title: 'Course started' });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error starting course',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateProgress = async (assignmentId: string, progressPercentage: number) => {
    try {
      const updates: any = { progress_percentage: progressPercentage };
      if (progressPercentage >= 100) {
        updates.status = 'completed';
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('user_course_assignments')
        .update(updates)
        .eq('id', assignmentId)
        .select(`*, course:courses(*)`)
        .single();

      if (error) throw error;
      setAssignments(prev => prev.map(a => a.id === assignmentId ? data : a));
      return data;
    } catch (error: any) {
      toast({
        title: 'Error updating progress',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return { assignments, loading, fetchAssignments, startCourse, updateProgress };
}

export function useModuleCompletions(userAssignmentId?: string) {
  const [completions, setCompletions] = useState<ModuleCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCompletions = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from('module_completions')
        .select('*')
        .eq('user_id', user.id);

      if (userAssignmentId) {
        query = query.eq('user_assignment_id', userAssignmentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCompletions(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching completions',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userAssignmentId, toast]);

  const completeModule = async (moduleId: string, userAssignmentId?: string, isPolicyAck?: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('module_completions')
        .insert({
          user_id: user.id,
          module_id: moduleId,
          user_assignment_id: userAssignmentId || null,
          policy_acknowledged_at: isPolicyAck ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      setCompletions(prev => [...prev, data]);
      toast({ title: 'Module completed' });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error completing module',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  useEffect(() => {
    fetchCompletions();
  }, [fetchCompletions]);

  return { completions, loading, fetchCompletions, completeModule };
}

export function useQuizAttempts(moduleId?: string) {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAttempts = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (moduleId) {
        query = query.eq('module_id', moduleId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAttempts((data || []).map(a => ({
        ...a,
        answers: (a.answers || []) as any,
      })));
    } catch (error: any) {
      toast({
        title: 'Error fetching quiz attempts',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [moduleId, toast]);

  const startAttempt = async (moduleId: string, userAssignmentId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const attemptNumber = attempts.filter(a => a.module_id === moduleId).length + 1;

      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          module_id: moduleId,
          user_assignment_id: userAssignmentId || null,
          attempt_number: attemptNumber,
        })
        .select()
        .single();

      if (error) throw error;
      const parsed = { ...data, answers: [] as any };
      setAttempts(prev => [parsed, ...prev]);
      return parsed;
    } catch (error: any) {
      toast({
        title: 'Error starting quiz',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const submitAttempt = async (
    attemptId: string, 
    answers: any[], 
    score: number, 
    maxScore: number,
    passMark: number
  ) => {
    try {
      const percentage = (score / maxScore) * 100;
      const passed = percentage >= passMark;

      const { data, error } = await supabase
        .from('quiz_attempts')
        .update({
          answers: answers as any,
          score,
          max_score: maxScore,
          percentage,
          passed,
          completed_at: new Date().toISOString(),
        })
        .eq('id', attemptId)
        .select()
        .single();

      if (error) throw error;
      const parsed = { ...data, answers: (data.answers || []) as any };
      setAttempts(prev => prev.map(a => a.id === attemptId ? parsed : a));
      toast({ 
        title: passed ? 'Quiz passed!' : 'Quiz completed',
        description: `Score: ${score}/${maxScore} (${percentage.toFixed(0)}%)`,
        variant: passed ? 'default' : 'destructive',
      });
      return parsed;
    } catch (error: any) {
      toast({
        title: 'Error submitting quiz',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  return { attempts, loading, fetchAttempts, startAttempt, submitAttempt };
}
