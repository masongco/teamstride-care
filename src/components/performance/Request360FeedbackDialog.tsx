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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useReviewFeedback } from '@/hooks/usePerformance';
import type { FeedbackType } from '@/types/performance';

const feedbackRequestSchema = z.object({
  responder_name: z.string().min(1, 'Name is required').max(100),
  responder_email: z.string().email('Invalid email address'),
  feedback_type: z.enum(['self', 'manager', 'peer', 'direct_report']),
  relationship_to_employee: z.string().max(100).optional(),
  is_anonymous: z.boolean().default(false),
});

type FeedbackRequestFormValues = z.infer<typeof feedbackRequestSchema>;

interface Request360FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewId: string;
}

export function Request360FeedbackDialog({ open, onOpenChange, reviewId }: Request360FeedbackDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { requestFeedback } = useReviewFeedback(reviewId);

  const form = useForm<FeedbackRequestFormValues>({
    resolver: zodResolver(feedbackRequestSchema),
    defaultValues: {
      responder_name: '',
      responder_email: '',
      feedback_type: 'peer',
      relationship_to_employee: '',
      is_anonymous: false,
    },
  });

  const onSubmit = async (values: FeedbackRequestFormValues) => {
    setIsSubmitting(true);
    try {
      await requestFeedback({
        review_id: reviewId,
        responder_name: values.responder_name,
        responder_email: values.responder_email,
        feedback_type: values.feedback_type as FeedbackType,
        relationship_to_employee: values.relationship_to_employee || null,
        is_anonymous: values.is_anonymous,
        overall_rating: null,
        strengths: null,
        areas_for_improvement: null,
        additional_comments: null,
        submitted_at: null,
        status: 'pending',
      });
      form.reset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Request 360 Feedback</DialogTitle>
          <DialogDescription>
            Invite someone to provide feedback on the employee's performance.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="responder_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responder Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="responder_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responder Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="feedback_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover">
                      <SelectItem value="self">Self Assessment</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="peer">Peer</SelectItem>
                      <SelectItem value="direct_report">Direct Report</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="relationship_to_employee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Team Lead, Colleague" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <span className="text-sm font-medium">Anonymous Feedback</span>
                <p className="text-xs text-muted-foreground">
                  Hide responder identity from the employee
                </p>
              </div>
              <FormField
                control={form.control}
                name="is_anonymous"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Request
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
