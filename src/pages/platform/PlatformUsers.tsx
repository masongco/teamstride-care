import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlatformLayout } from '@/components/platform/PlatformLayout';
import { PlatformGuard } from '@/components/platform/PlatformGuard';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { Users, Plus, MoreHorizontal, UserX, UserCheck, Shield } from 'lucide-react';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type PlatformRole = Database['public']['Enums']['platform_role'];

const roleColors: Record<string, string> = {
  owner: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  support: 'bg-green-500/10 text-green-400 border-green-500/20',
  support_readonly: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function PlatformUsers() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<PlatformRole>('support_readonly');
  const queryClient = useQueryClient();
  const { isOwner } = usePlatformAuth();

  const { data: platformUsers, isLoading } = useQuery({
    queryKey: ['platform-users-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateUserStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('platform_users')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-users-list'] });
      toast({ title: 'User status updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update user', description: error.message, variant: 'destructive' });
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: PlatformRole }) => {
      const { error } = await supabase
        .from('platform_users')
        .update({ role })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-users-list'] });
      toast({ title: 'User role updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update role', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <PlatformGuard>
      <PlatformLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Platform Users</h1>
              <p className="text-slate-400 mt-1">Manage platform administrator access</p>
            </div>
            {isOwner && (
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Invite User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Platform User</DialogTitle>
                    <DialogDescription>
                      Add a new platform administrator. They will need an existing auth account.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="Full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="admin@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as PlatformRole)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                          <SelectItem value="support_readonly">Support (Read-only)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        toast({ title: 'User invitation will be implemented via edge function' });
                        setInviteDialogOpen(false);
                      }}
                      disabled={!newUserEmail || !newUserName}
                    >
                      Send Invite
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Users Table */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Platform Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-slate-400">Loading users...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-700/50">
                      <TableHead className="text-slate-300">User</TableHead>
                      <TableHead className="text-slate-300">Role</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Last Login</TableHead>
                      <TableHead className="text-slate-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {platformUsers?.map((user) => (
                      <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                              <Shield className="h-5 w-5 text-slate-300" />
                            </div>
                            <div>
                              <p className="font-medium text-white">{user.name}</p>
                              <p className="text-sm text-slate-400">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isOwner && user.role !== 'owner' ? (
                            <Select
                              value={user.role}
                              onValueChange={(role) => updateUserRole.mutate({ id: user.id, role: role as PlatformRole })}
                            >
                              <SelectTrigger className="w-36 bg-transparent border-0 text-white">
                                <Badge variant="outline" className={roleColors[user.role]}>
                                  {user.role}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="support">Support</SelectItem>
                                <SelectItem value="support_readonly">Support (Read-only)</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline" className={roleColors[user.role]}>
                              {user.role}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={user.status === 'active' ? 'border-green-500/20 text-green-400' : 'border-red-500/20 text-red-400'}
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {user.last_login_at
                            ? format(new Date(user.last_login_at), 'dd MMM yyyy HH:mm')
                            : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          {isOwner && user.role !== 'owner' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-slate-300">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {user.status === 'active' ? (
                                  <DropdownMenuItem
                                    onClick={() => updateUserStatus.mutate({ id: user.id, status: 'disabled' })}
                                    className="text-red-400"
                                  >
                                    <UserX className="mr-2 h-4 w-4" />
                                    Disable User
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => updateUserStatus.mutate({ id: user.id, status: 'active' })}
                                    className="text-green-400"
                                  >
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Enable User
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {platformUsers?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                          No platform users found
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
