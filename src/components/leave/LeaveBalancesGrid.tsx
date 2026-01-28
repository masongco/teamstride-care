import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, TrendingUp } from 'lucide-react';
import { useLeave } from '@/hooks/useLeave';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';
import { AdjustBalanceDialog } from './AdjustBalanceDialog';

interface LeaveBalancesGridProps {
  onViewEmployee?: (employeeId: string) => void;
}

export function LeaveBalancesGrid({ onViewEmployee }: LeaveBalancesGridProps) {
  const { leaveBalances, leaveTypes, runAccruals, isRunningAccruals } = useLeave();
  const { employees } = useSupabaseEmployees();
  const activeEmployees = employees.filter(e => e.status === 'active');
  const [search, setSearch] = useState('');
  const [adjustDialog, setAdjustDialog] = useState<{
    open: boolean;
    employeeId: string | null;
    employeeName: string;
  }>({ open: false, employeeId: null, employeeName: '' });

  // Group balances by employee
  const employeeBalances = activeEmployees.map(emp => {
    const balances = leaveBalances.filter(b => b.employee_id === emp.id);
    return {
      employee: emp,
      balances: leaveTypes.map(lt => {
        const balance = balances.find(b => b.leave_type_id === lt.id);
        return {
          leaveType: lt,
          hours: balance?.balance_hours || 0,
        };
      }),
    };
  });

  // Filter by search
  const filteredEmployees = employeeBalances.filter(eb => {
    const fullName = `${eb.employee.first_name} ${eb.employee.last_name}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Leave Balances</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => runAccruals()}
              disabled={isRunningAccruals}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {isRunningAccruals ? 'Running...' : 'Run Accruals'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No employees found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map(({ employee, balances }) => (
                <div
                  key={employee.id}
                  className="p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div 
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => onViewEmployee?.(employee.id)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {employee.first_name[0]}
                          {employee.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium hover:text-primary">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {employee.employment_type?.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setAdjustDialog({
                        open: true,
                        employeeId: employee.id,
                        employeeName: `${employee.first_name} ${employee.last_name}`,
                      })}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {balances.slice(0, 4).map(({ leaveType, hours }) => (
                      <div
                        key={leaveType.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground truncate mr-2">
                          {leaveType.name}
                        </span>
                        <Badge
                          variant={hours > 0 ? 'secondary' : 'outline'}
                          className="font-mono"
                        >
                          {hours.toFixed(1)}h
                        </Badge>
                      </div>
                    ))}
                    {balances.length > 4 && (
                      <p className="text-xs text-muted-foreground text-center pt-1">
                        +{balances.length - 4} more
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AdjustBalanceDialog
        open={adjustDialog.open}
        onOpenChange={(open) => setAdjustDialog(prev => ({ ...prev, open }))}
        employeeId={adjustDialog.employeeId}
        employeeName={adjustDialog.employeeName}
      />
    </>
  );
}
