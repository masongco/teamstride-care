import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

export type AppRole = 'admin' | 'manager' | 'employee';
type PlatformRole = Database['public']['Enums']['platform_role'];

export interface UserWithRole {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  role: AppRole;
  created_at: string;
}

export function useUserRole() {
  const { user } = useAuth();
  const [currentUserRole, setCurrentUserRole] = useState<AppRole | null>(null);
  const [platformRole, setPlatformRole] = useState<PlatformRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRoles();
    } else {
      setCurrentUserRole(null);
      setPlatformRole(null);
      setLoading(false);
    }
  }, [user]);

  const fetchRoles = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [appRoleResult, platformRoleResult] = await Promise.all([
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase.rpc('get_platform_role', { _user_id: user.id }),
      ]);

      if (appRoleResult.error) {
        console.error('Error fetching user role:', appRoleResult.error);
        setCurrentUserRole('employee');
      } else {
        setCurrentUserRole(
          (appRoleResult.data?.role as AppRole) || 'employee',
        );
      }

      if (platformRoleResult.error) {
        // No platform role is a valid state; only log unexpected errors.
        const message = platformRoleResult.error.message || '';
        if (!message.toLowerCase().includes('not found')) {
          console.error(
            'Error fetching platform role:',
            platformRoleResult.error,
          );
        }
        setPlatformRole(null);
      } else {
        setPlatformRole(platformRoleResult.data as PlatformRole | null);
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
      setCurrentUserRole('employee');
      setPlatformRole(null);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = currentUserRole === 'admin';
  const isManager = currentUserRole === 'manager' || currentUserRole === 'admin';
  const isEmployee = currentUserRole === 'employee';
  const isPlatformUser = Boolean(platformRole);
  const isPlatformAdmin =
    platformRole === 'admin' || platformRole === 'owner';

  const hasPermission = (requiredRole: AppRole): boolean => {
    if (!currentUserRole) return false;
    
    const roleHierarchy: Record<AppRole, number> = {
      admin: 3,
      manager: 2,
      employee: 1,
    };
    
    return roleHierarchy[currentUserRole] >= roleHierarchy[requiredRole];
  };

  return {
    currentUserRole,
    platformRole,
    loading,
    isAdmin,
    isManager,
    isEmployee,
    isPlatformUser,
    isPlatformAdmin,
    hasPermission,
    refetch: fetchRoles,
  };
}

export function useUserRolesManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsersWithRoles = async () => {
    setLoading(true);
    try {
      // First get all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role, created_at');

      if (rolesError) throw rolesError;

      // Then get profiles for those users
      const userIds = rolesData?.map(r => r.user_id) || [];
      
      if (userIds.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const usersWithRoles: UserWithRole[] = rolesData.map(role => {
        const profile = profilesData?.find(p => p.user_id === role.user_id);
        return {
          id: role.id,
          user_id: role.user_id,
          email: profile?.display_name || 'Unknown',
          display_name: profile?.display_name,
          role: role.role as AppRole,
          created_at: role.created_at,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users with roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;
      
      await fetchUsersWithRoles();
      return { success: true };
    } catch (error) {
      console.error('Error updating user role:', error);
      return { success: false, error };
    }
  };

  const deleteUserRole = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      
      await fetchUsersWithRoles();
      return { success: true };
    } catch (error) {
      console.error('Error deleting user role:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchUsersWithRoles();
  }, []);

  return {
    users,
    loading,
    fetchUsersWithRoles,
    updateUserRole,
    deleteUserRole,
  };
}
