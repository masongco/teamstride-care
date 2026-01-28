import { useState } from 'react';
import { Calendar, Plus, Clock, CheckCircle, XCircle, TrendingUp, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeave } from '@/hooks/useLeave';
import { CreateLeaveRequestDialog } from '@/components/leave/CreateLeaveRequestDialog';
import { LeaveRequestList } from '@/components/leave/LeaveRequestList';
import { LeaveBalancesGrid } from '@/components/leave/LeaveBalancesGrid';
import { LeaveAdjustmentsHistory } from '@/components/leave/LeaveAdjustmentsHistory';

export default function Leave() {
  const [activeTab, setActiveTab] = useState('requests');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { stats, isLoading } = useLeave();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage leave requests, balances, and accruals.
          </p>
        </div>
        <Button className="gradient-primary" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Leave Request
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="card-interactive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.rejected}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.cancelled}</p>
                <p className="text-sm text-muted-foreground">Cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="requests">
            <Calendar className="h-4 w-4 mr-2" />
            Requests
          </TabsTrigger>
          <TabsTrigger value="balances">
            <TrendingUp className="h-4 w-4 mr-2" />
            Balances
          </TabsTrigger>
          <TabsTrigger value="adjustments">
            <History className="h-4 w-4 mr-2" />
            Adjustments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-6">
          <LeaveRequestList />
        </TabsContent>

        <TabsContent value="balances" className="mt-6">
          <LeaveBalancesGrid />
        </TabsContent>

        <TabsContent value="adjustments" className="mt-6">
          <LeaveAdjustmentsHistory />
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <CreateLeaveRequestDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
