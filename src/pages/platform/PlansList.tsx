import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlatformLayout } from '@/components/platform/PlatformLayout';
import { PlatformGuard } from '@/components/platform/PlatformGuard';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toast } from '@/hooks/use-toast';
import { CreditCard, Plus, Settings, AlertTriangle } from 'lucide-react';

const entitlementKeys = [
  { key: 'module_hr_core', label: 'HR Core', type: 'boolean' },
  { key: 'module_onboarding', label: 'Onboarding', type: 'boolean' },
  { key: 'module_compliance', label: 'Compliance', type: 'boolean' },
  { key: 'module_docs', label: 'Documents', type: 'boolean' },
  { key: 'module_leave', label: 'Leave Management', type: 'boolean' },
  { key: 'module_payroll', label: 'Payroll', type: 'boolean' },
  { key: 'module_reporting', label: 'Reporting', type: 'boolean' },
  { key: 'module_lms', label: 'LMS', type: 'boolean' },
  { key: 'limit_users', label: 'User Limit', type: 'number' },
  { key: 'limit_employees', label: 'Employee Limit', type: 'number' },
  { key: 'limit_storage_gb', label: 'Storage (GB)', type: 'number' },
  { key: 'audit_export_enabled', label: 'Audit Export', type: 'boolean' },
];

export default function PlansList() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDescription, setNewPlanDescription] = useState('');
  const queryClient = useQueryClient();
  const { isOwner } = usePlatformAuth();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['platform-plans-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select(`
          *,
          plan_entitlements (*),
          organisation_subscriptions (count)
        `)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: selectedPlanEntitlements } = useQuery({
    queryKey: ['platform-plan-entitlements', selectedPlan],
    queryFn: async () => {
      if (!selectedPlan) return [];
      const { data, error } = await supabase
        .from('plan_entitlements')
        .select('*')
        .eq('plan_id', selectedPlan);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPlan,
  });

  const createPlan = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .insert({
          name: newPlanName,
          description: newPlanDescription,
          status: 'active',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-plans-list'] });
      setCreateDialogOpen(false);
      setNewPlanName('');
      setNewPlanDescription('');
      toast({ title: 'Plan created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create plan', description: error.message, variant: 'destructive' });
    },
  });

  const updateEntitlement = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      if (!selectedPlan) return;
      
      const existing = selectedPlanEntitlements?.find((e) => e.key === key);
      
      if (existing) {
        const { error } = await supabase
          .from('plan_entitlements')
          .update({ value })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('plan_entitlements')
          .insert({ plan_id: selectedPlan, key, value });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-plan-entitlements', selectedPlan] });
      toast({ title: 'Entitlement updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
    },
  });

  const getEntitlementValue = (key: string) => {
    const ent = selectedPlanEntitlements?.find((e) => e.key === key);
    return ent?.value || 'false';
  };

  const selectedPlanData = plans?.find((p) => p.id === selectedPlan);

  return (
    <PlatformGuard>
      <PlatformLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Plans</h1>
              <p className="text-slate-400 mt-1">Manage subscription plans and entitlements</p>
            </div>
            {isOwner && (
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Plan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Plan</DialogTitle>
                    <DialogDescription>
                      Add a new subscription plan. You can configure entitlements after creation.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Plan Name</Label>
                      <Input
                        value={newPlanName}
                        onChange={(e) => setNewPlanName(e.target.value)}
                        placeholder="e.g., Enterprise Plus"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={newPlanDescription}
                        onChange={(e) => setNewPlanDescription(e.target.value)}
                        placeholder="Plan description..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => createPlan.mutate()} disabled={!newPlanName}>
                      Create Plan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Plans Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full text-center py-8 text-slate-400">Loading plans...</div>
            ) : (
              plans?.map((plan) => {
                const orgCount = (plan.organisation_subscriptions as any)?.[0]?.count || 0;
                
                return (
                  <Card
                    key={plan.id}
                    className="bg-slate-800 border-slate-700 cursor-pointer hover:border-slate-600 transition-colors"
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-white">{plan.name}</CardTitle>
                            <CardDescription className="text-slate-400">
                              {orgCount} organisation{orgCount !== 1 ? 's' : ''}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className={plan.status === 'active' ? 'border-green-500/20 text-green-500' : 'border-slate-500/20 text-slate-400'}>
                          {plan.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-400 line-clamp-2">
                        {plan.description || 'No description'}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                        <Settings className="h-4 w-4" />
                        {plan.plan_entitlements?.length || 0} entitlements configured
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Plan Entitlements Sheet */}
          <Sheet open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
            <SheetContent className="w-full sm:max-w-lg bg-slate-800 border-slate-700">
              <SheetHeader>
                <SheetTitle className="text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {selectedPlanData?.name} Entitlements
                </SheetTitle>
                <SheetDescription className="text-slate-400">
                  Configure default entitlements for this plan. Changes affect all organisations on this plan.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-1">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm mb-4">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>Changes will affect all organisations using this plan</span>
                </div>

                {entitlementKeys.map((ent) => {
                  const value = getEntitlementValue(ent.key);

                  return (
                    <div key={ent.key} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
                      <Label className="text-white">{ent.label}</Label>
                      {ent.type === 'boolean' ? (
                        <Switch
                          checked={value === 'true'}
                          onCheckedChange={(checked) => {
                            updateEntitlement.mutate({
                              key: ent.key,
                              value: checked ? 'true' : 'false',
                            });
                          }}
                          disabled={!isOwner}
                        />
                      ) : (
                        <Input
                          type="number"
                          value={value}
                          onChange={(e) => {
                            updateEntitlement.mutate({
                              key: ent.key,
                              value: e.target.value,
                            });
                          }}
                          className="w-24 bg-slate-700/50 border-slate-600 text-white"
                          disabled={!isOwner}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </PlatformLayout>
    </PlatformGuard>
  );
}
