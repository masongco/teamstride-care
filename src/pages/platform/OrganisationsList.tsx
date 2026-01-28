import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PlatformLayout } from '@/components/platform/PlatformLayout';
import { PlatformGuard } from '@/components/platform/PlatformGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Building2, Search, MoreHorizontal, Eye, Pause, Play, Lock, Plus } from 'lucide-react';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type OrgStatus = Database['public']['Enums']['org_status'];

const statusColors: Record<OrgStatus, string> = {
  trial: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  active: 'bg-green-500/10 text-green-500 border-green-500/20',
  suspended: 'bg-red-500/10 text-red-500 border-red-500/20',
  readonly: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
};

export default function OrganisationsList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: organisations, isLoading } = useQuery({
    queryKey: ['platform-organisations', search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('organisations')
        .select(`
          *,
          organisation_subscriptions (
            id,
            status,
            trial_ends_at,
            plans (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`legal_name.ilike.%${search}%,trading_name.ilike.%${search}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as OrgStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrgStatus }) => {
      const { error } = await supabase
        .from('organisations')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-organisations'] });
      toast({ title: 'Organisation status updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update status', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <PlatformGuard>
      <PlatformLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Organisations</h1>
              <p className="text-slate-400 mt-1">Manage tenant organisations</p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Organisation
            </Button>
          </div>

          {/* Filters */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search organisations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
                  <SelectTrigger className="w-[180px] bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="readonly">Read-only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Organisations Table */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                All Organisations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-slate-400">Loading organisations...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-700/50">
                      <TableHead className="text-slate-300">Organisation</TableHead>
                      <TableHead className="text-slate-300">Plan</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Trial Ends</TableHead>
                      <TableHead className="text-slate-300">Created</TableHead>
                      <TableHead className="text-slate-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organisations?.map((org) => {
                      const subscription = org.organisation_subscriptions?.[0];
                      const plan = subscription?.plans;
                      
                      return (
                        <TableRow key={org.id} className="border-slate-700 hover:bg-slate-700/50">
                          <TableCell>
                            <div>
                              <p className="font-medium text-white">{org.legal_name}</p>
                              {org.trading_name && (
                                <p className="text-sm text-slate-400">t/a {org.trading_name}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {plan?.name || 'No plan'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColors[org.status]}>
                              {org.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {subscription?.trial_ends_at
                              ? format(new Date(subscription.trial_ends_at), 'dd MMM yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {format(new Date(org.created_at), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-slate-300">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/platform/orgs/${org.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                {org.status !== 'suspended' && (
                                  <DropdownMenuItem
                                    onClick={() => updateStatus.mutate({ id: org.id, status: 'suspended' })}
                                    className="text-red-400"
                                  >
                                    <Pause className="mr-2 h-4 w-4" />
                                    Suspend
                                  </DropdownMenuItem>
                                )}
                                {org.status === 'suspended' && (
                                  <DropdownMenuItem
                                    onClick={() => updateStatus.mutate({ id: org.id, status: 'active' })}
                                    className="text-green-400"
                                  >
                                    <Play className="mr-2 h-4 w-4" />
                                    Activate
                                  </DropdownMenuItem>
                                )}
                                {org.status !== 'readonly' && org.status !== 'suspended' && (
                                  <DropdownMenuItem
                                    onClick={() => updateStatus.mutate({ id: org.id, status: 'readonly' })}
                                    className="text-amber-400"
                                  >
                                    <Lock className="mr-2 h-4 w-4" />
                                    Set Read-only
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {organisations?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                          No organisations found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </PlatformLayout>
    </PlatformGuard>
  );
}
