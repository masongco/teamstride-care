import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Users, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDocumentDistributions } from '@/hooks/useOrgDocuments';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type OrgDocument = Database['public']['Tables']['org_documents']['Row'];

interface DistributeDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: OrgDocument;
}

interface UserWithRole {
  id: string;
  email: string;
  display_name: string | null;
  role: string | null;
}

export function DistributeDocumentDialog({ open, onOpenChange, document }: DistributeDocumentDialogProps) {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createDistribution, distributions, refetch } = useDocumentDistributions(document.id);
  const { toast } = useToast();

  // Already distributed user IDs
  const distributedUserIds = new Set(distributions.map(d => d.recipient_user_id));

  useEffect(() => {
    if (open) {
      fetchUsers();
      setSelectedUsers(new Set());
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Fetch profiles with roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine data
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]));
      
      const usersWithRoles: UserWithRole[] = (profiles || []).map(p => ({
        id: p.user_id,
        email: p.display_name || 'Unknown',
        display_name: p.display_name,
        role: roleMap.get(p.user_id) || 'employee',
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    !distributedUserIds.has(user.id) && (
      user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleToggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedUsers.size === 0) return;

    setIsSubmitting(true);
    try {
      const selectedUsersList = users.filter(u => selectedUsers.has(u.id));
      
      for (const user of selectedUsersList) {
        await createDistribution({
          org_document_id: document.id,
          recipient_user_id: user.id,
          recipient_name: user.display_name || user.email,
          recipient_email: user.email,
        });
      }

      toast({
        title: 'Success',
        description: `Document distributed to ${selectedUsersList.length} recipient(s)`,
      });
      
      onOpenChange(false);
      refetch();
    } catch (error) {
      console.error('Error distributing document:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Distribute Document
          </DialogTitle>
          <DialogDescription>
            Select employees to receive "{document.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Requirements info */}
          {(document.requires_acknowledgment || document.requires_signature) && (
            <div className="flex gap-2 text-sm">
              {document.requires_acknowledgment && (
                <Badge variant="outline">Requires Acknowledgment</Badge>
              )}
              {document.requires_signature && (
                <Badge variant="outline">Requires Signature</Badge>
              )}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Select All */}
          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-primary hover:underline"
              >
                {selectedUsers.size === filteredUsers.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-sm text-muted-foreground">
                {selectedUsers.size} selected
              </span>
            </div>
          )}

          {/* User List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No employees available</p>
              <p className="text-sm">All users have already received this document</p>
            </div>
          ) : (
            <ScrollArea className="h-[280px] border rounded-lg">
              <div className="p-2 space-y-1">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleToggleUser(user.id)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedUsers.has(user.id)
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={() => handleToggleUser(user.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {(user.display_name || user.email).split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.display_name || user.email}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {user.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || selectedUsers.size === 0}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Distribute to {selectedUsers.size} {selectedUsers.size === 1 ? 'User' : 'Users'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
