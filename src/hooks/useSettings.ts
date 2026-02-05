import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Department {
  id: string;
  name: string;
  description: string | null;
  organisation_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: string;
  name: string;
  department_id: string | null;
  description: string | null;
  organisation_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AwardClassification {
  id: string;
  name: string;
  description: string | null;
  base_hourly_rate: number;
  saturday_multiplier: number;
  sunday_multiplier: number;
  public_holiday_multiplier: number;
  evening_multiplier: number;
  night_multiplier: number;
  overtime_multiplier: number;
  organisation_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AwardClassificationInput {
  name: string;
  description?: string;
  base_hourly_rate: number;
  saturday_multiplier?: number;
  sunday_multiplier?: number;
  public_holiday_multiplier?: number;
  evening_multiplier?: number;
  night_multiplier?: number;
  overtime_multiplier?: number;
}

export function useSettings(
  organisationId?: string,
  options?: { requireOrganisation?: boolean },
) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [awardClassifications, setAwardClassifications] = useState<AwardClassification[]>([]);
  const [loading, setLoading] = useState(true);

  const shouldBlockQueries = options?.requireOrganisation && !organisationId;

  const fetchDepartments = async () => {
    if (shouldBlockQueries) {
      setDepartments([]);
      return;
    }
    let query = supabase.from('departments').select('*').order('name');
    if (organisationId) {
      query = query.eq('organisation_id', organisationId);
    }
    const { data, error } = await query;
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load departments',
        variant: 'destructive',
      });
      return;
    }
    setDepartments(data || []);
  };

  const fetchPositions = async () => {
    if (shouldBlockQueries) {
      setPositions([]);
      return;
    }
    let query = supabase.from('positions').select('*').order('name');
    if (organisationId) {
      query = query.eq('organisation_id', organisationId);
    }
    const { data, error } = await query;
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load positions',
        variant: 'destructive',
      });
      return;
    }
    setPositions(data || []);
  };

  const fetchAwardClassifications = async () => {
    if (shouldBlockQueries) {
      setAwardClassifications([]);
      return;
    }
    let query = supabase
      .from('award_classifications')
      .select('*')
      .order('name');
    if (organisationId) {
      query = query.eq('organisation_id', organisationId);
    }
    const { data, error } = await query;
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load award classifications',
        variant: 'destructive',
      });
      return;
    }
    setAwardClassifications(data || []);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (shouldBlockQueries) {
        setLoading(false);
        return;
      }
      await Promise.all([
        fetchDepartments(),
        fetchPositions(),
        fetchAwardClassifications(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [organisationId, shouldBlockQueries]);

  const addDepartment = async (name: string, description?: string) => {
    const { data, error } = await supabase
      .from('departments')
      .insert({
        name,
        description: description || null,
        ...(organisationId ? { organisation_id: organisationId } : {}),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        toast({
          title: 'Error',
          description: 'A department with this name already exists',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to add department',
          variant: 'destructive',
        });
      }
      return null;
    }

    setDepartments(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    toast({
      title: 'Success',
      description: 'Department added successfully',
    });
    return data;
  };

  const updateDepartment = async (id: string, name: string, description?: string) => {
    const { data, error } = await supabase
      .from('departments')
      .update({ name, description: description || null })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update department',
        variant: 'destructive',
      });
      return null;
    }

    setDepartments(prev => 
      prev.map(d => d.id === id ? data : d).sort((a, b) => a.name.localeCompare(b.name))
    );
    toast({
      title: 'Success',
      description: 'Department updated successfully',
    });
    return data;
  };

  const deleteDepartment = async (id: string) => {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete department',
        variant: 'destructive',
      });
      return false;
    }

    setDepartments(prev => prev.filter(d => d.id !== id));
    toast({
      title: 'Success',
      description: 'Department deleted successfully',
    });
    return true;
  };

  const addPosition = async (name: string, departmentId?: string, description?: string) => {
    const { data, error } = await supabase
      .from('positions')
      .insert({ 
        name, 
        department_id: departmentId || null,
        description: description || null,
        ...(organisationId ? { organisation_id: organisationId } : {}),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        toast({
          title: 'Error',
          description: 'A position with this name already exists',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to add position',
          variant: 'destructive',
        });
      }
      return null;
    }

    setPositions(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    toast({
      title: 'Success',
      description: 'Position added successfully',
    });
    return data;
  };

  const updatePosition = async (id: string, name: string, departmentId?: string, description?: string) => {
    const { data, error } = await supabase
      .from('positions')
      .update({ 
        name, 
        department_id: departmentId || null,
        description: description || null 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update position',
        variant: 'destructive',
      });
      return null;
    }

    setPositions(prev => 
      prev.map(p => p.id === id ? data : p).sort((a, b) => a.name.localeCompare(b.name))
    );
    toast({
      title: 'Success',
      description: 'Position updated successfully',
    });
    return data;
  };

  const deletePosition = async (id: string) => {
    const { error } = await supabase
      .from('positions')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete position',
        variant: 'destructive',
      });
      return false;
    }

    setPositions(prev => prev.filter(p => p.id !== id));
    toast({
      title: 'Success',
      description: 'Position deleted successfully',
    });
    return true;
  };

  // Award Classification methods
  const addAwardClassification = async (input: AwardClassificationInput) => {
    const { data, error } = await supabase
      .from('award_classifications')
      .insert({
        name: input.name,
        description: input.description || null,
        base_hourly_rate: input.base_hourly_rate,
        saturday_multiplier: input.saturday_multiplier ?? 1.5,
        sunday_multiplier: input.sunday_multiplier ?? 2.0,
        public_holiday_multiplier: input.public_holiday_multiplier ?? 2.5,
        evening_multiplier: input.evening_multiplier ?? 1.15,
        night_multiplier: input.night_multiplier ?? 1.25,
        overtime_multiplier: input.overtime_multiplier ?? 1.5,
        ...(organisationId ? { organisation_id: organisationId } : {}),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        toast({
          title: 'Error',
          description: 'An award classification with this name already exists',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to add award classification',
          variant: 'destructive',
        });
      }
      return null;
    }

    setAwardClassifications(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    toast({
      title: 'Success',
      description: 'Award classification added successfully',
    });
    return data;
  };

  const updateAwardClassification = async (id: string, input: AwardClassificationInput) => {
    const { data, error } = await supabase
      .from('award_classifications')
      .update({
        name: input.name,
        description: input.description || null,
        base_hourly_rate: input.base_hourly_rate,
        saturday_multiplier: input.saturday_multiplier,
        sunday_multiplier: input.sunday_multiplier,
        public_holiday_multiplier: input.public_holiday_multiplier,
        evening_multiplier: input.evening_multiplier,
        night_multiplier: input.night_multiplier,
        overtime_multiplier: input.overtime_multiplier,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update award classification',
        variant: 'destructive',
      });
      return null;
    }

    setAwardClassifications(prev => 
      prev.map(a => a.id === id ? data : a).sort((a, b) => a.name.localeCompare(b.name))
    );
    toast({
      title: 'Success',
      description: 'Award classification updated successfully',
    });
    return data;
  };

  const deleteAwardClassification = async (id: string) => {
    const { error } = await supabase
      .from('award_classifications')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete award classification',
        variant: 'destructive',
      });
      return false;
    }

    setAwardClassifications(prev => prev.filter(a => a.id !== id));
    toast({
      title: 'Success',
      description: 'Award classification deleted successfully',
    });
    return true;
  };

  return {
    departments,
    positions,
    awardClassifications,
    loading,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addPosition,
    updatePosition,
    deletePosition,
    addAwardClassification,
    updateAwardClassification,
    deleteAwardClassification,
    refetch: async () => {
      await Promise.all([fetchDepartments(), fetchPositions(), fetchAwardClassifications()]);
    },
  };
}
