import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlatformLayout } from '@/components/platform/PlatformLayout';
import { PlatformGuard } from '@/components/platform/PlatformGuard';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  Settings,
  Users,
  FileText,
  Shield,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type OrgStatus = Database['public']['Enums']['org_status'];

const statusColors: Record<OrgStatus, string> = {
  trial: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  active: 'bg-green-500/10 text-green-500 border-green-500/20',
  suspended: 'bg-red-500/10 text-red-500 border-red-500/20',
  readonly: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
};

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

export default function OrganisationDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { canImpersonate } = usePlatformAuth();

  const { data: org, isLoading } = useQuery({
    queryKey: ['platform-organisation', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organisations')
        .select(`
          *,
          organisation_subscriptions (
            id,
            status,
            trial_ends_at,
            start_date,
            end_date,
            plans (
              id,
              name,
              description
            )
          )
        `)
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: plans } = useQuery({
    queryKey: ['platform-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: planEntitlements } = useQuery({
    queryKey: ['platform-plan-entitlements', org?.organisation_subscriptions?.[0]?.plans?.id],
    queryFn: async () => {
      const planId = org?.organisation_subscriptions?.[0]?.plans?.id;
      if (!planId) return [];
      const { data, error } = await supabase
        .from('plan_entitlements')
        .select('*')
        .eq('plan_id', planId);
      if (error) throw error;
      return data;
    },
    enabled: !!org?.organisation_subscriptions?.[0]?.plans?.id,
  });

  const { data: orgEntitlements } = useQuery({
    queryKey: ['platform-org-entitlements', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organisation_entitlements')
        .select('*')
        .eq('organisation_id', id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['platform-audit-logs', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_audit_logs')
        .select('*')
        .eq('organisation_id', id!)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const updateOrgStatus = useMutation({
    mutationFn: async (status: OrgStatus) => {
      const { error } = await supabase
        .from('organisations')
        .update({ status })
        .eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-organisation', id] });
      toast({ title: 'Status updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update status', description: error.message, variant: 'destructive' });
    },
  });

  const updateEntitlement = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const existing = orgEntitlements?.find((e) => e.key === key);
      
      if (existing) {
        const { error } = await supabase
          .from('organisation_entitlements')
          .update({ value })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('organisation_entitlements')
          .insert({ organisation_id: id!, key, value });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-org-entitlements', id] });
      toast({ title: 'Entitlement updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update entitlement', description: error.message, variant: 'destructive' });
    },
  });

  const getEffectiveEntitlement = (key: string) => {
    const orgOverride = orgEntitlements?.find((e) => e.key === key);
    if (orgOverride) return orgOverride.value;
    const planValue = planEntitlements?.find((e) => e.key === key);
    return planValue?.value || 'false';
  };

  if (isLoading) {
    return (
      <PlatformGuard>
        <PlatformLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </PlatformLayout>
      </PlatformGuard>
    );
  }

  if (!org) {
    return (
      <PlatformGuard>
        <PlatformLayout>
          <div className="text-center py-16">
            <p className="text-slate-400">Organisation not found</p>
          </div>
        </PlatformLayout>
      </PlatformGuard>
    );
  }

  const subscription = org.organisation_subscriptions?.[0];
  const plan = subscription?.plans;

  return (
    <PlatformGuard>
      <PlatformLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="text-slate-300">
              <Link to="/platform/orgs">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{org.legal_name}</h1>
                <Badge variant="outline" className={statusColors[org.status]}>
                  {org.status}
                </Badge>
              </div>
              {org.trading_name && (
                <p className="text-slate-400 mt-1">t/a {org.trading_name}</p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-slate-800 border border-slate-700">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="entitlements">Entitlements</TabsTrigger>
              <TabsTrigger value="audit">Audit Log</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-slate-400">Status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={org.status}
                      onValueChange={(value) => updateOrgStatus.mutate(value as OrgStatus)}
                    >
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="readonly">Read-only</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-slate-400">Current Plan</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-semibold text-white">{plan?.name || 'No plan'}</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-slate-400">Trial Ends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-semibold text-white">
                      {subscription?.trial_ends_at
                        ? format(new Date(subscription.trial_ends_at), 'dd MMM yyyy')
                        : 'N/A'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-slate-400">Created</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-semibold text-white">
                      {format(new Date(org.created_at), 'dd MMM yyyy')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Organisation Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-slate-400">Legal Name</Label>
                      <p className="text-white">{org.legal_name}</p>
                    </div>
                    <div>
                      <Label className="text-slate-400">Trading Name</Label>
                      <p className="text-white">{org.trading_name || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-slate-400">Timezone</Label>
                      <p className="text-white">{org.timezone || 'Australia/Sydney'}</p>
                    </div>
                    <div>
                      <Label className="text-slate-400">Organisation ID</Label>
                      <p className="text-white font-mono text-sm">{org.id}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription" className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Subscription Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-400">Assigned Plan</Label>
                      <Select
                        value={plan?.id}
                        onValueChange={(planId) => {
                          // TODO: Implement plan change mutation
                          toast({ title: 'Plan change will be implemented' });
                        }}
                      >
                        <SelectTrigger className="mt-2 bg-slate-700/50 border-slate-600 text-white">
                          <SelectValue placeholder="Select a plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {plans?.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-slate-400">Trial End Date</Label>
                        <Input
                          type="date"
                          value={subscription?.trial_ends_at?.split('T')[0] || ''}
                          className="mt-2 bg-slate-700/50 border-slate-600 text-white"
                          onChange={(e) => {
                            // TODO: Implement trial date change
                            toast({ title: 'Trial date change will be implemented' });
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-slate-400">Subscription Status</Label>
                        <p className="mt-2 text-white capitalize">{subscription?.status || 'None'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Entitlements Tab */}
            <TabsContent value="entitlements" className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Feature Entitlements
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Configure module access and limits. Overrides apply on top of the plan defaults.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {entitlementKeys.map((ent) => {
                      const effectiveValue = getEffectiveEntitlement(ent.key);
                      const hasOverride = orgEntitlements?.some((e) => e.key === ent.key);

                      return (
                        <div key={ent.key} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                          <div>
                            <p className="text-white font-medium">{ent.label}</p>
                            <p className="text-sm text-slate-400">
                              {hasOverride ? (
                                <span className="text-amber-400">Override active</span>
                              ) : (
                                'Using plan default'
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            {ent.type === 'boolean' ? (
                              <Switch
                                checked={effectiveValue === 'true'}
                                onCheckedChange={(checked) => {
                                  updateEntitlement.mutate({
                                    key: ent.key,
                                    value: checked ? 'true' : 'false',
                                  });
                                }}
                              />
                            ) : (
                              <Input
                                type="number"
                                value={effectiveValue}
                                onChange={(e) => {
                                  updateEntitlement.mutate({
                                    key: ent.key,
                                    value: e.target.value,
                                  });
                                }}
                                className="w-24 bg-slate-700/50 border-slate-600 text-white"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audit Tab */}
            <TabsContent value="audit" className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Audit Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {auditLogs?.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">No audit logs found</p>
                  ) : (
                    <div className="space-y-3">
                      {auditLogs?.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/50">
                          <div className="flex-1">
                            <p className="text-white font-medium">{log.action}</p>
                            <p className="text-sm text-slate-400">
                              Target: {log.target_type} {log.target_id && `(${log.target_id})`}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {format(new Date(log.created_at), 'dd MMM yyyy HH:mm:ss')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Support Impersonation
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Start a support session to access this organisation's HRMS as an admin.
                    All actions will be logged.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {canImpersonate ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-400">Reason for impersonation</Label>
                        <Input
                          placeholder="e.g., Customer support ticket #12345"
                          className="mt-2 bg-slate-700/50 border-slate-600 text-white"
                        />
                      </div>
                      <Button className="gap-2">
                        <Shield className="h-4 w-4" />
                        Start Support Session
                      </Button>
                      <p className="text-sm text-slate-400">
                        Session will automatically expire after 30 minutes.
                      </p>
                    </div>
                  ) : (
                    <p className="text-amber-400">
                      You do not have permission to start impersonation sessions.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PlatformLayout>
    </PlatformGuard>
  );
}
