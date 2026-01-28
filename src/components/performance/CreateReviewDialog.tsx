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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePerformanceReviews } from '@/hooks/usePerformance';
import { mockEmployees } from '@/lib/mock-data';
import type { ReviewType } from '@/types/performance';

// Get only active employees for selection
const activeEmployees = mockEmployees.filter(e => e.status === 'active');

const reviewSchema = z.object({
  employee_id: z.string().min(1, 'Please select an employee'),
  reviewer_id: z.string().min(1, 'Please select a reviewer'),
  review_type: z.enum(['performance', 'annual', 'probation']),
  review_period_start: z.date({ required_error: 'Start date is required' }),
  review_period_end: z.date({ required_error: 'End date is required' }),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface CreateReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateReviewDialog({ open, onOpenChange }: CreateReviewDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createReview } = usePerformanceReviews();

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      employee_id: '',
      reviewer_id: '',
      review_type: 'performance',
    },
  });

  const selectedEmployeeId = form.watch('employee_id');
  const selectedReviewerId = form.watch('reviewer_id');

  const onSubmit = async (values: ReviewFormValues) => {
    const employee = activeEmployees.find(e => e.id === values.employee_id);
    const reviewer = activeEmployees.find(e => e.id === values.reviewer_id);
    
    if (!employee || !reviewer) return;

    setIsSubmitting(true);
    try {
      await createReview({
        employee_name: `${employee.firstName} ${employee.lastName}`,
        employee_email: employee.email,
        employee_position: employee.position || null,
        employee_department: employee.department || null,
        reviewer_name: `${reviewer.firstName} ${reviewer.lastName}`,
        reviewer_email: reviewer.email,
        review_type: values.review_type as ReviewType,
        review_period_start: format(values.review_period_start, 'yyyy-MM-dd'),
        review_period_end: format(values.review_period_end, 'yyyy-MM-dd'),
        status: 'draft',
        overall_rating: null,
        overall_feedback: null,
        strengths: null,
        areas_for_improvement: null,
        development_plan: null,
        employee_comments: null,
        completed_at: null,
      });
      form.reset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Performance Review</DialogTitle>
          <DialogDescription>
            Set up a new performance review for an employee with goals, competency ratings, and 360 feedback.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Employee Details</h4>
              <FormField
                control={form.control}
                name="employee_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Employee</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an employee to review" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover">
                        {activeEmployees
                          .filter(e => e.id !== selectedReviewerId)
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
              {selectedEmployeeId && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  {(() => {
                    const emp = activeEmployees.find(e => e.id === selectedEmployeeId);
                    return emp ? (
                      <div className="space-y-1">
                        <p><span className="font-medium">Email:</span> {emp.email}</p>
                        <p><span className="font-medium">Position:</span> {emp.position}</p>
                        <p><span className="font-medium">Department:</span> {emp.department}</p>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Reviewer Details</h4>
              <FormField
                control={form.control}
                name="reviewer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Reviewer</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reviewer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover">
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
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Review Settings</h4>
              <FormField
                control={form.control}
                name="review_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select review type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover">
                        <SelectItem value="performance">Performance Review</SelectItem>
                        <SelectItem value="annual">Annual Review</SelectItem>
                        <SelectItem value="probation">Probation Review</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="review_period_start"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Period Start</FormLabel>
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
                  name="review_period_end"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Period End</FormLabel>
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
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Review
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
