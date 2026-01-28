import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSupervisions } from '@/hooks/usePerformance';
import { useEmployees } from '@/hooks/useEmployees';

const supervisionSchema = z.object({
  employee_id: z.string().min(1, 'Please select an employee'),
  supervisor_id: z.string().min(1, 'Please select a supervisor'),
  start_date: z.date({ required_error: 'Start date is required' }),
  notes: z.string().max(500).optional(),
});

type SupervisionFormValues = z.infer<typeof supervisionSchema>;

interface CreateSupervisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSupervisionDialog({ open, onOpenChange }: CreateSupervisionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createSupervision } = useSupervisions();
  const { activeEmployees } = useEmployees();

  const form = useForm<SupervisionFormValues>({
    resolver: zodResolver(supervisionSchema),
    defaultValues: {
      employee_id: '',
      supervisor_id: '',
      notes: '',
    },
  });

  const onSubmit = async (values: SupervisionFormValues) => {
    const employee = activeEmployees.find(e => e.id === values.employee_id);
    const supervisor = activeEmployees.find(e => e.id === values.supervisor_id);
    
    if (!employee || !supervisor) return;

    setIsSubmitting(true);
    try {
      await createSupervision({
        supervisor_name: `${supervisor.firstName} ${supervisor.lastName}`,
        supervisor_email: supervisor.email,
        employee_name: `${employee.firstName} ${employee.lastName}`,
        employee_email: employee.email,
        start_date: format(values.start_date, 'yyyy-MM-dd'),
        end_date: null,
        is_active: true,
        notes: values.notes || null,
      });
      form.reset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEmployeeId = form.watch('employee_id');
  const selectedSupervisorId = form.watch('supervisor_id');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Supervision Assignment</DialogTitle>
          <DialogDescription>
            Assign a supervisor to an employee for ongoing supervision sessions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeEmployees
                        .filter(e => e.id !== selectedSupervisorId)
                        .map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.firstName} {employee.lastName} - {employee.position}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supervisor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supervisor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a supervisor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeEmployees
                        .filter(e => e.id !== selectedEmployeeId)
                        .map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.firstName} {employee.lastName} - {employee.position}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional notes about this supervision arrangement..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Assignment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
