import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Calendar, Lock, CheckCircle, Loader2 } from 'lucide-react';
import type { PayPeriod } from '@/types/payroll';

interface PayPeriodManagerProps {
  payPeriods: PayPeriod[];
  onCreatePayPeriod: (input: { start_date: string; end_date: string }) => Promise<unknown>;
  onClosePayPeriod: (payPeriodId: string) => Promise<unknown>;
  onSelectPayPeriod: (payPeriod: PayPeriod) => void;
  selectedPayPeriodId?: string;
  isCreating: boolean;
}

export function PayPeriodManager({
  payPeriods,
  onCreatePayPeriod,
  onClosePayPeriod,
  onSelectPayPeriod,
  selectedPayPeriodId,
  isCreating,
}: PayPeriodManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleCreate = async () => {
    if (!startDate || !endDate) return;
    await onCreatePayPeriod({ start_date: startDate, end_date: endDate });
    setIsDialogOpen(false);
    setStartDate('');
    setEndDate('');
  };

  const getStatusBadge = (status: PayPeriod['status']) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Open</Badge>;
      case 'exported':
        return <Badge variant="outline" className="bg-accent/50 text-accent-foreground border-accent/30">Exported</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-muted text-muted-foreground border-muted">Closed</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Pay Periods
          </CardTitle>
          <CardDescription>
            Manage pay periods for payroll exports
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Pay Period
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Pay Period</DialogTitle>
              <DialogDescription>
                Define the date range for this pay period
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating || !startDate || !endDate}>
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {payPeriods.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pay periods created yet</p>
            <p className="text-sm">Create a pay period to start exporting payroll</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payPeriods.map((period) => (
                <TableRow
                  key={period.id}
                  className={selectedPayPeriodId === period.id ? 'bg-muted/50' : ''}
                >
                  <TableCell className="font-medium">
                    {format(new Date(period.start_date), 'dd MMM yyyy')} -{' '}
                    {format(new Date(period.end_date), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>{getStatusBadge(period.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {period.created_by_name || period.created_by_email}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {period.status === 'open' && (
                        <Button
                          size="sm"
                          variant={selectedPayPeriodId === period.id ? 'default' : 'outline'}
                          onClick={() => onSelectPayPeriod(period)}
                        >
                          Select
                        </Button>
                      )}
                      {period.status === 'exported' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onClosePayPeriod(period.id)}
                        >
                          <Lock className="h-4 w-4 mr-1" />
                          Close
                        </Button>
                      )}
                      {period.status === 'closed' && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
