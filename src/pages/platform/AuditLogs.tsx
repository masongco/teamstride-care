import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlatformLayout } from '@/components/platform/PlatformLayout';
import { PlatformGuard } from '@/components/platform/PlatformGuard';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { FileText, Search, Download, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { isOwner } = usePlatformAuth();

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['platform-audit-logs-all', search, actionFilter, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('platform_audit_logs')
        .select(`
          *,
          platform_users!platform_audit_logs_actor_platform_user_id_fkey (
            name,
            email
          ),
          organisations (
            legal_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (actionFilter !== 'all') {
        query = query.ilike('action', `%${actionFilter}%`);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', `${dateTo}T23:59:59`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filteredLogs = auditLogs?.filter((log) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      log.action?.toLowerCase().includes(searchLower) ||
      log.target_type?.toLowerCase().includes(searchLower) ||
      (log.platform_users as any)?.name?.toLowerCase().includes(searchLower) ||
      (log.organisations as any)?.legal_name?.toLowerCase().includes(searchLower)
    );
  });

  const exportCSV = () => {
    if (!filteredLogs?.length) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    const headers = ['Date', 'Actor', 'Action', 'Target Type', 'Target ID', 'Organisation'];
    const rows = filteredLogs.map((log) => [
      format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      (log.platform_users as any)?.name || 'System',
      log.action,
      log.target_type || '',
      log.target_id || '',
      (log.organisations as any)?.legal_name || '',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Audit logs exported' });
  };

  return (
    <PlatformGuard>
      <PlatformLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
              <p className="text-slate-400 mt-1">View platform-wide audit trail</p>
            </div>
            {isOwner && (
              <Button onClick={exportCSV} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>

          {/* Filters */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search logs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[180px] bg-slate-700/50 border-slate-600 text-white">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="impersonate">Impersonate</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white"
                    placeholder="From"
                  />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white"
                    placeholder="To"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-slate-400">Loading audit logs...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-700/50">
                      <TableHead className="text-slate-300">Timestamp</TableHead>
                      <TableHead className="text-slate-300">Actor</TableHead>
                      <TableHead className="text-slate-300">Action</TableHead>
                      <TableHead className="text-slate-300">Target</TableHead>
                      <TableHead className="text-slate-300">Organisation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs?.map((log) => (
                      <TableRow key={log.id} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell className="text-slate-300 font-mono text-sm">
                          {format(new Date(log.created_at), 'dd MMM yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-white">
                              {(log.platform_users as any)?.name || 'System'}
                            </p>
                            <p className="text-xs text-slate-400">
                              {(log.platform_users as any)?.email || ''}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded bg-slate-700 text-slate-200 text-sm">
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {log.target_type && (
                            <span>
                              {log.target_type}
                              {log.target_id && (
                                <span className="text-slate-500 text-xs ml-1">
                                  ({log.target_id.slice(0, 8)}...)
                                </span>
                              )}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {(log.organisations as any)?.legal_name || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredLogs?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                          No audit logs found
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
