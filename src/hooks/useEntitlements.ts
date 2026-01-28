import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Entitlements {
  module_hr_core: boolean;
  module_onboarding: boolean;
  module_compliance: boolean;
  module_docs: boolean;
  module_leave: boolean;
  module_payroll: boolean;
  module_reporting: boolean;
  module_lms: boolean;
  limit_users: number;
  limit_employees: number;
  limit_storage_gb: number;
  audit_export_enabled: boolean;
}

const defaultEntitlements: Entitlements = {
  module_hr_core: true,
  module_onboarding: true,
  module_compliance: true,
  module_docs: true,
  module_leave: true,
  module_payroll: true,
  module_reporting: true,
  module_lms: true,
  limit_users: 100,
  limit_employees: 500,
  limit_storage_gb: 10,
  audit_export_enabled: true,
};

export function useEntitlements(organisationId?: string) {
  const { data: entitlements, isLoading } = useQuery({
    queryKey: ['entitlements', organisationId],
    queryFn: async () => {
      // If no org ID, return defaults (for development/testing)
      if (!organisationId) {
        return defaultEntitlements;
      }

      // Get organisation subscription and plan
      const { data: subscription, error: subError } = await supabase
        .from('organisation_subscriptions')
        .select(`
          plan_id,
          plans (
            id,
            name
          )
        `)
        .eq('organisation_id', organisationId)
        .eq('status', 'active')
        .maybeSingle();

      if (subError) {
        console.error('Error fetching subscription:', subError);
        return defaultEntitlements;
      }

      if (!subscription?.plan_id) {
        return defaultEntitlements;
      }

      // Get plan entitlements
      const { data: planEnts, error: planError } = await supabase
        .from('plan_entitlements')
        .select('key, value')
        .eq('plan_id', subscription.plan_id);

      if (planError) {
        console.error('Error fetching plan entitlements:', planError);
        return defaultEntitlements;
      }

      // Get organisation-specific overrides
      const { data: orgEnts, error: orgError } = await supabase
        .from('organisation_entitlements')
        .select('key, value')
        .eq('organisation_id', organisationId);

      if (orgError) {
        console.error('Error fetching org entitlements:', orgError);
      }

      // Merge plan + org overrides
      const entMap: Record<string, string> = {};
      
      // First apply plan entitlements
      planEnts?.forEach((ent) => {
        entMap[ent.key] = ent.value;
      });

      // Then apply org overrides
      orgEnts?.forEach((ent) => {
        entMap[ent.key] = ent.value;
      });

      // Convert to typed entitlements
      return {
        module_hr_core: entMap.module_hr_core === 'true',
        module_onboarding: entMap.module_onboarding === 'true',
        module_compliance: entMap.module_compliance === 'true',
        module_docs: entMap.module_docs === 'true',
        module_leave: entMap.module_leave === 'true',
        module_payroll: entMap.module_payroll === 'true',
        module_reporting: entMap.module_reporting === 'true',
        module_lms: entMap.module_lms === 'true',
        limit_users: parseInt(entMap.limit_users || '100', 10),
        limit_employees: parseInt(entMap.limit_employees || '500', 10),
        limit_storage_gb: parseInt(entMap.limit_storage_gb || '10', 10),
        audit_export_enabled: entMap.audit_export_enabled === 'true',
      } as Entitlements;
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const isModuleEnabled = (moduleKey: keyof Entitlements): boolean => {
    if (!entitlements) return true; // Default to enabled while loading
    const value = entitlements[moduleKey];
    return typeof value === 'boolean' ? value : true;
  };

  const getLimit = (limitKey: keyof Entitlements): number => {
    if (!entitlements) return 999; // Default to high limit while loading
    const value = entitlements[limitKey];
    return typeof value === 'number' ? value : 999;
  };

  return {
    entitlements: entitlements || defaultEntitlements,
    isLoading,
    isModuleEnabled,
    getLimit,
  };
}
