import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: string;
  name: string;
  department_id: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useSettings() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');
    
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
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .order('name');
    
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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDepartments(), fetchPositions()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const addDepartment = async (name: string, description?: string) => {
    const { data, error } = await supabase
      .from('departments')
      .insert({ name, description: description || null })
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
        description: description || null 
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

  return {
    departments,
    positions,
    loading,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addPosition,
    updatePosition,
    deletePosition,
    refetch: async () => {
      await Promise.all([fetchDepartments(), fetchPositions()]);
    },
  };
}
