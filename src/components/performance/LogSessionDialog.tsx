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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSupervisionSessions } from '@/hooks/usePerformance';

const sessionSchema = z.object({
  session_date: z.date({ required_error: 'Session date is required' }),
  duration_minutes: z.coerce.number().min(1, 'Duration must be at least 1 minute').optional(),
  location: z.string().max(100).optional(),
  topics_discussed: z.string().max(2000).optional(),
  action_items: z.string().max(2000).optional(),
  follow_up_required: z.boolean().default(false),
  next_session_date: z.date().optional(),
  notes: z.string().max(2000).optional(),
});

type SessionFormValues = z.infer<typeof sessionSchema>;

interface LogSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supervisionId: string;
}

export function LogSessionDialog({ open, onOpenChange, supervisionId }: LogSessionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createSession } = useSupervisionSessions(supervisionId);

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      follow_up_required: false,
      location: '',
      topics_discussed: '',
      action_items: '',
      notes: '',
    },
  });

  const onSubmit = async (values: SessionFormValues) => {
    setIsSubmitting(true);
    try {
      await createSession({
        supervision_id: supervisionId,
        session_date: format(values.session_date, 'yyyy-MM-dd'),
        duration_minutes: values.duration_minutes || null,
        location: values.location || null,
        topics_discussed: values.topics_discussed || null,
        action_items: values.action_items || null,
        follow_up_required: values.follow_up_required,
        next_session_date: values.next_session_date ? format(values.next_session_date, 'yyyy-MM-dd') : null,
        notes: values.notes || null,
        created_by: null,
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
          <DialogTitle>Log Supervision Session</DialogTitle>
          <DialogDescription>
            Record details of a supervision meeting including topics discussed and action items.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="session_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Session Date</FormLabel>
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
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="60" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Office, Video Call, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="topics_discussed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topics Discussed</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Key topics covered during the session..."
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="action_items"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action Items</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tasks and follow-up actions..."
                      className="resize-none min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <span className="text-sm font-medium">Follow-up Required</span>
                <p className="text-xs text-muted-foreground">
                  Mark if additional follow-up is needed before next session
                </p>
              </div>
              <FormField
                control={form.control}
                name="follow_up_required"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="next_session_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Next Session Date (Optional)</FormLabel>
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
                          {field.value ? format(field.value, 'PPP') : <span>Schedule next session</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
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
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any other observations or comments..."
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
                Log Session
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
