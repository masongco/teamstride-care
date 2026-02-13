import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, AlertTriangle, CheckCircle2, Users } from 'lucide-react';
import { addDays, addMonths, differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';
import { usePerformanceReviews, useSupervisionSessions, useSupervisions } from '@/hooks/usePerformance';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';
import type { PerformanceReview, ReviewStatus, ReviewType } from '@/types/performance';

interface TimelineTabProps {
  searchQuery: string;
}

type EventStatus = 'overdue' | 'due' | 'scheduled' | 'completed' | 'in_progress';

type TimelineEvent = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  label: string;
  dueDate: Date;
  status: EventStatus;
  context?: string;
};

const STATUS_STYLES: Record<EventStatus, { label: string; className: string; icon: typeof Clock }> = {
  overdue: { label: 'Overdue', className: 'bg-destructive/10 text-destructive', icon: AlertTriangle },
  due: { label: 'Due Soon', className: 'bg-warning/10 text-warning', icon: Clock },
  scheduled: { label: 'Scheduled', className: 'bg-muted text-muted-foreground', icon: Calendar },
  completed: { label: 'Completed', className: 'bg-success/10 text-success', icon: CheckCircle2 },
  in_progress: { label: 'In Progress', className: 'bg-info/10 text-info', icon: Clock },
};

const PROBATION_OFFSETS = [30, 60, 90];
const PROMPT_WINDOW_DAYS = 14;

const getEventStatus = (dueDate: Date, completed: boolean, inProgress: boolean) => {
  if (completed) return 'completed';
  if (inProgress) return 'in_progress';
  const daysAway = differenceInCalendarDays(dueDate, new Date());
  if (daysAway < 0) return 'overdue';
  if (daysAway <= PROMPT_WINDOW_DAYS) return 'due';
  return 'scheduled';
};

const toDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
};

const getReviewCompletion = (review: PerformanceReview) => {
  if (review.completed_at) return toDate(review.completed_at);
  if (review.status === 'completed') return toDate(review.updated_at) || toDate(review.review_period_end);
  return null;
};

const matchReview = (review: PerformanceReview, email: string, type: ReviewType) =>
  review.employee_email?.toLowerCase() === email.toLowerCase() && review.review_type === type;

const isActiveReviewStatus = (status: ReviewStatus) =>
  status === 'draft' || status === 'in_progress' || status === 'pending_approval';

export function TimelineTab({ searchQuery }: TimelineTabProps) {
  const [supervisionCadence, setSupervisionCadence] = useState<'monthly' | 'quarterly'>('monthly');
  const { employees, isLoading: employeesLoading } = useSupabaseEmployees();
  const { supervisions, loading: supervisionsLoading } = useSupervisions();
  const { sessions, loading: sessionsLoading } = useSupervisionSessions();
  const { reviews, loading: reviewsLoading } = usePerformanceReviews();

  const cadenceDays = supervisionCadence === 'monthly' ? 30 : 90;

  const events = useMemo(() => {
    const now = new Date();
    const normalizedSearch = searchQuery.toLowerCase().trim();

    const eventsList: TimelineEvent[] = [];

    employees.forEach((employee) => {
      const employeeName = `${employee.first_name} ${employee.last_name}`.trim();
      const employeeEmail = employee.email;
      const matchesSearch =
        !normalizedSearch ||
        employeeName.toLowerCase().includes(normalizedSearch) ||
        employeeEmail.toLowerCase().includes(normalizedSearch);

      if (!matchesSearch) return;

      const startDate = toDate(employee.start_date);

      if (startDate) {
        const probationReviews = reviews.filter((review) => matchReview(review, employeeEmail, 'probation'));

        PROBATION_OFFSETS.forEach((offset) => {
          const dueDate = addDays(startDate, offset);
          const completedDate = probationReviews
            .map(getReviewCompletion)
            .filter(Boolean)
            .find((completed) => completed && completed >= dueDate);

          const status = getEventStatus(dueDate, !!completedDate, false);

          eventsList.push({
            id: `probation-${employee.id}-${offset}`,
            employeeId: employee.id,
            employeeName,
            employeeEmail,
            label: `Probation Check-in (${offset} day)`,
            dueDate,
            status,
            context: 'Probation check-in expected within onboarding period.',
          });
        });
      }

      const employeeSupervisions = supervisions.filter(
        (supervision) => supervision.employee_email.toLowerCase() === employeeEmail.toLowerCase() && supervision.is_active
      );

      employeeSupervisions.forEach((supervision) => {
        const supervisionSessions = sessions
          .filter((session) => session.supervision_id === supervision.id)
          .map((session) => toDate(session.session_date))
          .filter(Boolean) as Date[];
        const lastSession = supervisionSessions.sort((a, b) => b.getTime() - a.getTime())[0];
        const supervisionStart = toDate(supervision.start_date);
        const referenceDate = lastSession || supervisionStart;
        if (!referenceDate) return;

        const dueDate = addDays(referenceDate, cadenceDays);
        const status = getEventStatus(dueDate, false, false);

        eventsList.push({
          id: `supervision-${supervision.id}`,
          employeeId: employee.id,
          employeeName,
          employeeEmail,
          label: `Supervision (${supervisionCadence})`,
          dueDate,
          status,
          context: lastSession
            ? `Last session on ${format(lastSession, 'dd MMM yyyy')}.`
            : `Scheduled from ${format(referenceDate, 'dd MMM yyyy')}.`,
        });
      });

      const employeeAnnualReviews = reviews.filter((review) => matchReview(review, employeeEmail, 'annual'));
      const activeAnnual = employeeAnnualReviews.find((review) => isActiveReviewStatus(review.status));

      if (activeAnnual) {
        const dueDate = toDate(activeAnnual.review_period_end) || toDate(activeAnnual.updated_at) || now;
        eventsList.push({
          id: `annual-${activeAnnual.id}`,
          employeeId: employee.id,
          employeeName,
          employeeEmail,
          label: 'Annual Review',
          dueDate,
          status: getEventStatus(dueDate, false, true),
          context: `Review ${activeAnnual.status.replace('_', ' ')}.`,
        });
      } else if (startDate) {
        const completedAnnuals = employeeAnnualReviews
          .map((review) => getReviewCompletion(review))
          .filter(Boolean) as Date[];
        const lastCompleted = completedAnnuals.sort((a, b) => b.getTime() - a.getTime())[0];
        const anchor = lastCompleted || startDate;
        const dueDate = addMonths(anchor, 12);
        const status = getEventStatus(dueDate, false, false);

        eventsList.push({
          id: `annual-${employee.id}-${anchor.toISOString()}`,
          employeeId: employee.id,
          employeeName,
          employeeEmail,
          label: 'Annual Review',
          dueDate,
          status,
          context: lastCompleted
            ? `Last completed on ${format(lastCompleted, 'dd MMM yyyy')}.`
            : 'No annual review on record yet.',
        });
      }
    });

    return eventsList.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [employees, reviews, sessions, supervisions, supervisionCadence, searchQuery]);

  const promptEvents = events.filter((event) => event.status === 'overdue' || event.status === 'due');

  const isLoading = employeesLoading || supervisionsLoading || sessionsLoading || reviewsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading performance timeline...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Performance Timeline</CardTitle>
            <CardDescription>
              Upcoming performance checkpoints and supervision cadence per employee.
            </CardDescription>
          </div>
          <div className="w-full sm:w-[220px]">
            <Select value={supervisionCadence} onValueChange={(value) => setSupervisionCadence(value as typeof supervisionCadence)}>
              <SelectTrigger>
                <SelectValue placeholder="Supervision cadence" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="monthly">Monthly supervision</SelectItem>
                <SelectItem value="quarterly">Quarterly supervision</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 text-sm">
            <Badge className="bg-destructive/10 text-destructive">{promptEvents.filter(e => e.status === 'overdue').length} overdue</Badge>
            <Badge className="bg-warning/10 text-warning">{promptEvents.filter(e => e.status === 'due').length} due soon</Badge>
            <Badge className="bg-muted text-muted-foreground">{events.length} total events</Badge>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No performance checkpoints found for the current filters.</p>
              <p className="text-sm mt-1">Add employees with start dates or create supervision assignments to populate the timeline.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Checkpoint</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prompt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => {
                  const config = STATUS_STYLES[event.status];
                  const StatusIcon = config.icon;
                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{event.employeeName}</p>
                          <p className="text-xs text-muted-foreground">{event.employeeEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{event.label}</p>
                          {event.context && (
                            <p className="text-xs text-muted-foreground">{event.context}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(event.dueDate, 'dd MMM yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`gap-1 ${config.className}`}>
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(event.status === 'due' || event.status === 'overdue') ? (
                          <Badge className="bg-primary/10 text-primary">Prompt leadership</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
