import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLeave } from '@/hooks/useLeave';
import { AlertTriangle } from 'lucide-react';

const formSchema = z.object({
  leaveTypeId: z.string().min(1, 'Leave type is required'),
  adjustmentHours: z.number().refine(val => val !== 0, 'Hours cannot be zero'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

type FormData = z.infer<typeof formSchema>;

interface AdjustBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string | null;
  employeeName: string;
}

export function AdjustBalanceDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
}: AdjustBalanceDialogProps) {
  const { leaveTypes, createAdjustment, isCreatingAdjustment, getEmployeeBalances } = useLeave();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leaveTypeId: '',
      adjustmentHours: 0,
      reason: '',
    },
  });

  const selectedTypeId = form.watch('leaveTypeId');
  const balances = employeeId ? getEmployeeBalances(employeeId) : [];
  const currentBalance = balances.find(b => b.leave_type_id === selectedTypeId);

  const onSubmit = (data: FormData) => {
    if (!employeeId) return;

    createAdjustment({
      employee_id: employeeId,
      leave_type_id: data.leaveTypeId,
      adjustment_hours: data.adjustmentHours,
      reason: data.reason,
    }, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Leave Balance</DialogTitle>
          <DialogDescription>
            Manually adjust the leave balance for {employeeName}.
            This action will be logged for audit purposes.
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Balance adjustments are tracked in the audit log and visible in compliance reports.
            A detailed reason is required.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="leaveTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {leaveTypes.map((lt) => (
                        <SelectItem key={lt.id} value={lt.id}>
                          {lt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentBalance && (
                    <FormDescription>
                      Current balance: {currentBalance.balance_hours?.toFixed(1) || 0} hours
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adjustmentHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adjustment Hours</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="e.g., 8 or -16"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Use positive numbers to add hours, negative to deduct.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why this adjustment is being made..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This will be recorded in the audit log.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreatingAdjustment}
              >
                {isCreatingAdjustment ? 'Saving...' : 'Save Adjustment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
