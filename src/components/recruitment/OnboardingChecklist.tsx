import { CheckCircle, Clock, AlertCircle, Circle, FileText, GraduationCap, ShieldCheck, Settings, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { OnboardingProgress, OnboardingTask, OnboardingTaskStatus } from '@/types/recruitment';
import { mockOnboardingTasks } from '@/lib/mock-recruitment';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface OnboardingChecklistProps {
  onboardingProgress: OnboardingProgress[];
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  documents: FileText,
  training: GraduationCap,
  compliance: ShieldCheck,
  setup: Settings,
  admin: ClipboardList,
};

const categoryLabels: Record<string, string> = {
  documents: 'Documents',
  training: 'Training',
  compliance: 'Compliance',
  setup: 'System Setup',
  admin: 'Administrative',
};

const statusConfig: Record<OnboardingTaskStatus, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  completed: { icon: CheckCircle, color: 'text-success' },
  in_progress: { icon: Clock, color: 'text-info' },
  pending: { icon: Circle, color: 'text-muted-foreground' },
  overdue: { icon: AlertCircle, color: 'text-destructive' },
};

export function OnboardingChecklist({ onboardingProgress }: OnboardingChecklistProps) {
  const getTaskById = (taskId: string) => mockOnboardingTasks.find(t => t.id === taskId);

  const groupTasksByCategory = (tasks: OnboardingTask[]) => {
    return tasks.reduce((acc, task) => {
      if (!acc[task.category]) {
        acc[task.category] = [];
      }
      acc[task.category].push(task);
      return acc;
    }, {} as Record<string, OnboardingTask[]>);
  };

  const groupedTasks = groupTasksByCategory(mockOnboardingTasks);

  return (
    <div className="space-y-6">
      {/* Onboarding Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {onboardingProgress.map((progress) => {
          const completedTasks = progress.tasks.filter(t => t.status === 'completed').length;
          const totalTasks = progress.tasks.length;

          return (
            <Card key={progress.employeeId} className="card-interactive">
              <CardContent className="pt-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {progress.employeeName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{progress.employeeName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Starts {format(parseISO(progress.startDate), 'MMMM d, yyyy')}
                    </p>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{progress.completionPercentage}%</span>
                      </div>
                      <Progress value={progress.completionPercentage} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {completedTasks} of {totalTasks} tasks completed
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm font-medium mb-2">Outstanding Tasks</p>
                  <div className="space-y-2">
                    {progress.tasks
                      .filter(t => t.status !== 'completed')
                      .slice(0, 3)
                      .map((taskProgress) => {
                        const task = getTaskById(taskProgress.taskId);
                        if (!task) return null;
                        const StatusIcon = statusConfig[taskProgress.status].icon;
                        return (
                          <div key={taskProgress.taskId} className="flex items-center gap-2 text-sm">
                            <StatusIcon className={cn('h-4 w-4', statusConfig[taskProgress.status].color)} />
                            <span className="truncate">{task.title}</span>
                            {task.required && (
                              <Badge variant="outline" className="text-xs ml-auto">Required</Badge>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4">
                  View Full Checklist
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Full Checklist Template */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Onboarding Checklist Template</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {Object.entries(groupedTasks).map(([category, tasks]) => {
              const CategoryIcon = categoryIcons[category] || FileText;
              return (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <CategoryIcon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{categoryLabels[category]}</span>
                      <Badge variant="secondary" className="ml-2">
                        {tasks.length} tasks
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {tasks.map((task) => (
                        <div 
                          key={task.id} 
                          className="flex items-start gap-3 p-3 rounded-lg border border-border"
                        >
                          <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{task.title}</p>
                              {task.required && (
                                <Badge variant="outline" className="text-xs">Required</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {task.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Due within {task.dueInDays} days of start date
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
