import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PlatformRole = Database['public']['Enums']['platform_role'];

interface PlatformUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: PlatformRole;
  status: string;
}

export function usePlatformAuth() {
  const [platformUser, setPlatformUser] = useState<PlatformUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkPlatformAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          navigate('/platform/login');
          return;
        }

        const { data: platformUserData, error } = await supabase
          .from('platform_users')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (error || !platformUserData) {
          navigate('/platform/login');
          return;
        }

        setPlatformUser(platformUserData as PlatformUser);
      } catch (error) {
        console.error('Platform auth check failed:', error);
        navigate('/platform/login');
      } finally {
        setLoading(false);
      }
    };

    checkPlatformAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setPlatformUser(null);
        navigate('/platform/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const isOwner = platformUser?.role === 'owner';
  const isAdmin = platformUser?.role === 'admin' || isOwner;
  const canImpersonate = isOwner || platformUser?.role === 'admin';

  return {
    platformUser,
    loading,
    isOwner,
    isAdmin,
    canImpersonate,
  };
}
