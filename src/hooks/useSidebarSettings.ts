import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SidebarSetting {
  id: string;
  module_key: string;
  module_label: string;
  is_visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function useSidebarSettings() {
  const [settings, setSettings] = useState<SidebarSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('sidebar_settings')
      .select('*')
      .order('display_order');

    if (error) {
      console.error('Failed to load sidebar settings:', error);
      return;
    }

    setSettings(data || []);
  };

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      await fetchSettings();
      setLoading(false);
    };
    loadSettings();
  }, []);

  const updateVisibility = async (moduleKey: string, isVisible: boolean) => {
    const { error } = await supabase
      .from('sidebar_settings')
      .update({ is_visible: isVisible })
      .eq('module_key', moduleKey);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update sidebar visibility. You may not have admin permissions.',
        variant: 'destructive',
      });
      return false;
    }

    setSettings(prev =>
      prev.map(s => s.module_key === moduleKey ? { ...s, is_visible: isVisible } : s)
    );

    toast({
      title: 'Success',
      description: `${moduleKey} visibility updated`,
    });

    return true;
  };

  const updateOrder = async (moduleKey: string, newOrder: number) => {
    const { error } = await supabase
      .from('sidebar_settings')
      .update({ display_order: newOrder })
      .eq('module_key', moduleKey);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update display order',
        variant: 'destructive',
      });
      return false;
    }

    await fetchSettings();
    return true;
  };

  const isModuleVisible = (moduleKey: string): boolean => {
    const setting = settings.find(s => s.module_key === moduleKey);
    return setting?.is_visible ?? true;
  };

  const getVisibleModules = (): string[] => {
    return settings
      .filter(s => s.is_visible)
      .sort((a, b) => a.display_order - b.display_order)
      .map(s => s.module_key);
  };

  return {
    settings,
    loading,
    updateVisibility,
    updateOrder,
    isModuleVisible,
    getVisibleModules,
    refetch: fetchSettings,
  };
}
