import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Plus,
  Calendar, 
  CheckCircle,
  Clock,
  Pause,
  TrendingUp,
  Flag
} from 'lucide-react';
import { format } from 'date-fns';
import { useEmployeeGoals, EmployeeGoal } from '@/hooks/useEmployeeGoals';
import { CreateGoalDialog } from '@/components/portal/CreateGoalDialog';
import { GoalDetailSheet } from '@/components/portal/GoalDetailSheet';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }> = {
  not_started: { label: 'Not Started', variant: 'secondary', icon: Clock },
  in_progress: { label: 'In Progress', variant: 'default', icon: TrendingUp },
  completed: { label: 'Completed', variant: 'default', icon: CheckCircle },
  on_hold: { label: 'On Hold', variant: 'outline', icon: Pause },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-muted-foreground' },
  medium: { label: 'Medium', color: 'text-warning' },
  high: { label: 'High', color: 'text-destructive' },
};

const categoryLabels: Record<string, string> = {
  professional: 'Professional Development',
  technical: 'Technical Skills',
  leadership: 'Leadership',
  personal: 'Personal Growth',
  certification: 'Certification',
  other: 'Other',
};

export default function MyGoals() {
  const { goals, loading, createGoal, updateGoal, deleteGoal, toggleMilestone } = useEmployeeGoals();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<EmployeeGoal | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const activeGoals = goals.filter(g => g.status !== 'completed');
  const completedGoals = goals.filter(g => g.status === 'completed');

  const stats = {
    total: goals.length,
    inProgress: goals.filter(g => g.status === 'in_progress').length,
    completed: completedGoals.length,
    avgProgress: goals.length > 0 
      ? Math.round(goals.reduce((sum, g) => sum + g.progress_percentage, 0) / goals.length)
      : 0,
  };

  const handleViewDetails = (goal: EmployeeGoal) => {
    setSelectedGoal(goal);
    setDetailOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Development Goals</h1>
          <p className="text-muted-foreground mt-1">
            Set and track your personal development objectives
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Goals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-lg bg-info/10">
              <TrendingUp className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-lg bg-success/10">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-lg bg-warning/10">
              <Flag className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.avgProgress}%</p>
              <p className="text-sm text-muted-foreground">Avg Progress</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Active ({activeGoals.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed ({completedGoals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeGoals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">No Active Goals</h3>
                <p className="text-muted-foreground mt-1 mb-4">
                  Start by creating your first development goal
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            activeGoals.map(goal => (
              <GoalCard 
                key={goal.id} 
                goal={goal} 
                onViewDetails={handleViewDetails}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedGoals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">No Completed Goals</h3>
                <p className="text-muted-foreground mt-1">
                  Your completed goals will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            completedGoals.map(goal => (
              <GoalCard 
                key={goal.id} 
                goal={goal} 
                onViewDetails={handleViewDetails}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <CreateGoalDialog 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateGoal={createGoal}
      />

      {/* Detail Sheet */}
      {selectedGoal && (
        <GoalDetailSheet 
          goal={selectedGoal}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onUpdate={updateGoal}
          onDelete={deleteGoal}
          onToggleMilestone={toggleMilestone}
        />
      )}
    </div>
  );
}

function GoalCard({ 
  goal, 
  onViewDetails 
}: { 
  goal: EmployeeGoal; 
  onViewDetails: (goal: EmployeeGoal) => void;
}) {
  const config = statusConfig[goal.status] || statusConfig.not_started;
  const priority = priorityConfig[goal.priority] || priorityConfig.medium;
  const StatusIcon = config.icon;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewDetails(goal)}>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-semibold">{goal.title}</h3>
                <Badge variant={config.variant} className="flex items-center gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {config.label}
                </Badge>
                <span className={`text-xs font-medium ${priority.color}`}>
                  {priority.label} Priority
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {categoryLabels[goal.category] || goal.category}
              </p>
            </div>
          </div>

          {/* Description */}
          {goal.description && (
            <p className="text-sm line-clamp-2">{goal.description}</p>
          )}

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{goal.progress_percentage}%</span>
            </div>
            <Progress value={goal.progress_percentage} className="h-2" />
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {goal.target_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Due: {format(new Date(goal.target_date), 'MMM d, yyyy')}</span>
              </div>
            )}
            {goal.milestones.length > 0 && (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                <span>
                  {goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} milestones
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
