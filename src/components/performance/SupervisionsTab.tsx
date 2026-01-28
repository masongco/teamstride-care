import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Plus, MoreHorizontal, Calendar, MessageSquare, Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useSupervisions } from '@/hooks/usePerformance';
import { CreateSupervisionDialog } from './CreateSupervisionDialog';
import { LogSessionDialog } from './LogSessionDialog';

interface SupervisionsTabProps {
  searchQuery: string;
}

export function SupervisionsTab({ searchQuery }: SupervisionsTabProps) {
  const { supervisions, loading, deleteSupervision, updateSupervision } = useSupervisions();
  const [createOpen, setCreateOpen] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [selectedSupervisionId, setSelectedSupervisionId] = useState<string | null>(null);

  const filteredSupervisions = supervisions.filter(s => 
    s.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.supervisor_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogSession = (supervisionId: string) => {
    setSelectedSupervisionId(supervisionId);
    setSessionDialogOpen(true);
  };

  const handleEndSupervision = async (id: string) => {
    await updateSupervision(id, { 
      is_active: false, 
      end_date: new Date().toISOString().split('T')[0] 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Supervision Assignments</CardTitle>
            <CardDescription>
              Manage supervisor-employee relationships and log supervision sessions
            </CardDescription>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Supervision
          </Button>
        </CardHeader>
        <CardContent>
          {filteredSupervisions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No supervision assignments found</p>
              <p className="text-sm mt-1">Create a new supervision assignment to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSupervisions.map((supervision) => (
                  <TableRow key={supervision.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {supervision.employee_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{supervision.employee_name}</p>
                          <p className="text-xs text-muted-foreground">{supervision.employee_email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {supervision.supervisor_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{supervision.supervisor_name}</p>
                          <p className="text-xs text-muted-foreground">{supervision.supervisor_email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(supervision.start_date), 'dd MMM yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={supervision.is_active ? 'default' : 'secondary'}>
                        {supervision.is_active ? 'Active' : 'Ended'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => handleLogSession(supervision.id)}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Log Session
                          </DropdownMenuItem>
                          {supervision.is_active && (
                            <DropdownMenuItem 
                              onClick={() => handleEndSupervision(supervision.id)}
                              className="text-destructive"
                            >
                              End Supervision
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => deleteSupervision(supervision.id)}
                            className="text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateSupervisionDialog open={createOpen} onOpenChange={setCreateOpen} />
      
      {selectedSupervisionId && (
        <LogSessionDialog 
          open={sessionDialogOpen} 
          onOpenChange={setSessionDialogOpen}
          supervisionId={selectedSupervisionId}
        />
      )}
    </>
  );
}
