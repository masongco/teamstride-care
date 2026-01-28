import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CheckCircle, XCircle, Ban, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useLeave } from '@/hooks/useLeave';
import type { LeaveRequest } from '@/types/leave';

interface LeaveRequestListProps {
  onViewEmployee?: (employeeId: string) => void;
}

export function LeaveRequestList({ onViewEmployee }: LeaveRequestListProps) {
  const { leaveRequests, stats, processDecision, isProcessingDecision, getEmployeeBalances } = useLeave();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | 'cancel' | null;
    reason: string;
    override: boolean;
    insufficientBalance: boolean;
  }>({
    open: false,
    action: null,
    reason: '',
    override: false,
    insufficientBalance: false,
  });

  const filteredRequests = activeTab === 'all' 
    ? leaveRequests 
    : leaveRequests.filter(r => r.status === activeTab);

  const openActionDialog = (request: LeaveRequest, action: 'approve' | 'reject' | 'cancel') => {
    // Check balance for approval
    let insufficientBalance = false;
    if (action === 'approve' && request.leave_type_id) {
      const balances = getEmployeeBalances(request.employee_id);
      const balance = balances.find(b => b.leave_type_id === request.leave_type_id);
      insufficientBalance = !balance || balance.balance_hours < request.hours;
    }

    setSelectedRequest(request);
    setActionDialog({
      open: true,
      action,
      reason: '',
      override: false,
      insufficientBalance,
    });
  };

  const handleAction = () => {
    if (!selectedRequest || !actionDialog.action) return;

    processDecision({
      request_id: selectedRequest.id,
      action: actionDialog.action,
      reason: actionDialog.reason || undefined,
      override_insufficient_balance: actionDialog.override,
    }, {
      onSuccess: () => {
        setActionDialog({ open: false, action: null, reason: '', override: false, insufficientBalance: false });
        setSelectedRequest(null);
      },
    });
  };

  const getLeaveTypeBadgeColor = (typeName: string): string => {
    const colors: Record<string, string> = {
      'Annual Leave': 'bg-info/10 text-info',
      'Personal/Sick Leave': 'bg-warning/10 text-warning',
      'Compassionate Leave': 'bg-primary/10 text-primary',
      'Parental Leave': 'bg-success/10 text-success',
      'Unpaid Leave': 'bg-muted text-muted-foreground',
      'Other': 'bg-muted text-muted-foreground',
    };
    return colors[typeName] || 'bg-muted text-muted-foreground';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pending ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No leave requests found</p>
                </div>
              ) : (
                filteredRequests.map((request) => {
                  const employee = request.employee;
                  if (!employee) return null;

                  return (
                    <div
                      key={request.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <Avatar 
                        className="h-12 w-12 flex-shrink-0 cursor-pointer"
                        onClick={() => onViewEmployee?.(employee.id)}
                      >
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {employee.first_name[0]}
                          {employee.last_name[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p 
                            className="font-semibold cursor-pointer hover:text-primary"
                            onClick={() => onViewEmployee?.(employee.id)}
                          >
                            {employee.first_name} {employee.last_name}
                          </p>
                          {request.leave_type && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${getLeaveTypeBadgeColor(request.leave_type.name)}`}
                            >
                              {request.leave_type.name}
                            </span>
                          )}
                          <StatusBadge status={request.status} size="sm" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(parseISO(request.start_date), 'EEE, dd MMM')} -{' '}
                          {format(parseISO(request.end_date), 'EEE, dd MMM yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {request.hours} hours
                          {request.override_reason && (
                            <span className="ml-2 text-warning">
                              <AlertTriangle className="inline h-3 w-3 mr-1" />
                              Override applied
                            </span>
                          )}
                        </p>
                        {request.reason && (
                          <p className="text-sm text-muted-foreground mt-1 italic">
                            "{request.reason}"
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        {request.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-success border-success hover:bg-success/10"
                              onClick={() => openActionDialog(request, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive hover:bg-destructive/10"
                              onClick={() => openActionDialog(request, 'reject')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {request.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-muted-foreground"
                            onClick={() => openActionDialog(request, 'cancel')}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog 
        open={actionDialog.open} 
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog({ open: false, action: null, reason: '', override: false, insufficientBalance: false });
            setSelectedRequest(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'approve' && 'Approve Leave Request'}
              {actionDialog.action === 'reject' && 'Reject Leave Request'}
              {actionDialog.action === 'cancel' && 'Cancel Leave Request'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'approve' && 'This will deduct the hours from the employee\'s balance.'}
              {actionDialog.action === 'reject' && 'The employee will be notified of the rejection.'}
              {actionDialog.action === 'cancel' && 'This will restore the hours to the employee\'s balance.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {actionDialog.insufficientBalance && actionDialog.action === 'approve' && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-warning">Insufficient Balance</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      The employee does not have enough leave balance for this request.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Checkbox
                        id="override"
                        checked={actionDialog.override}
                        onCheckedChange={(checked) => 
                          setActionDialog(prev => ({ ...prev, override: !!checked }))
                        }
                      />
                      <Label htmlFor="override" className="text-sm">
                        Override and approve anyway (requires reason)
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(actionDialog.action === 'reject' || 
              actionDialog.action === 'cancel' || 
              (actionDialog.insufficientBalance && actionDialog.override)) && (
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Reason {actionDialog.override ? '(Required)' : '(Optional)'}
                </Label>
                <Textarea
                  id="reason"
                  value={actionDialog.reason}
                  onChange={(e) => setActionDialog(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Enter reason..."
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialog({ open: false, action: null, reason: '', override: false, insufficientBalance: false });
                setSelectedRequest(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={
                isProcessingDecision ||
                (actionDialog.insufficientBalance && actionDialog.action === 'approve' && !actionDialog.override) ||
                (actionDialog.override && !actionDialog.reason.trim())
              }
              className={
                actionDialog.action === 'approve' 
                  ? 'bg-success hover:bg-success/90' 
                  : actionDialog.action === 'reject'
                    ? 'bg-destructive hover:bg-destructive/90'
                    : ''
              }
            >
              {isProcessingDecision ? 'Processing...' : `Confirm ${actionDialog.action}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
