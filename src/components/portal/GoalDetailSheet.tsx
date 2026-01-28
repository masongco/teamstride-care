import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Pause, 
  TrendingUp, 
  Trash2,
  Target,
  Flag
} from 'lucide-react';
import { format } from 'date-fns';
import { EmployeeGoal, UpdateGoalData } from '@/hooks/useEmployeeGoals';

interface GoalDetailSheetProps {
  goal: EmployeeGoal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (goalId: string, updates: UpdateGoalData) => Promise<any>;
  onDelete: (goalId: string) => Promise<void>;
  onToggleMilestone: (goalId: string, milestoneId: string) => Promise<void>;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }> = {
  not_started: { label: 'Not Started', variant: 'secondary', icon: Clock },
  in_progress: { label: 'In Progress', variant: 'default', icon: TrendingUp },
  completed: { label: 'Completed', variant: 'default', icon: CheckCircle },
  on_hold: { label: 'On Hold', variant: 'outline', icon: Pause },
};

const categoryLabels: Record<string, string> = {
  professional: 'Professional Development',
  technical: 'Technical Skills',
  leadership: 'Leadership',
  personal: 'Personal Growth',
  certification: 'Certification',
  other: 'Other',
};

export function GoalDetailSheet({ 
  goal, 
  open, 
  onOpenChange, 
  onUpdate, 
  onDelete,
  onToggleMilestone 
}: GoalDetailSheetProps) {
  const [notes, setNotes] = useState(goal.notes || '');
  const [status, setStatus] = useState(goal.status);
  const [progress, setProgress] = useState(goal.progress_percentage);
  const [saving, setSaving] = useState(false);

  const config = statusConfig[goal.status] || statusConfig.not_started;
  const StatusIcon = config.icon;

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await onUpdate(goal.id, { notes });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus as EmployeeGoal['status']);
    await onUpdate(goal.id, { 
      status: newStatus as EmployeeGoal['status'],
      progress_percentage: newStatus === 'completed' ? 100 : progress
    });
  };

  const handleProgressChange = async (value: number[]) => {
    const newProgress = value[0];
    setProgress(newProgress);
    await onUpdate(goal.id, { 
      progress_percentage: newProgress,
      status: newProgress === 100 ? 'completed' : newProgress > 0 ? 'in_progress' : 'not_started'
    });
  };

  const handleDelete = async () => {
    await onDelete(goal.id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <SheetTitle>{goal.title}</SheetTitle>
            </div>
          </div>
          <SheetDescription>
            {categoryLabels[goal.category] || goal.category}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Status & Priority */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={config.variant} className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Flag className="h-3 w-3" />
              {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)} Priority
            </Badge>
          </div>

          {/* Description */}
          {goal.description && (
            <div>
              <h4 className="text-sm font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{goal.description}</p>
            </div>
          )}

          {/* Target Date */}
          {goal.target_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Target: {format(new Date(goal.target_date), 'MMMM d, yyyy')}</span>
            </div>
          )}

          <Separator />

          {/* Progress */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Progress</h4>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            <Slider
              value={[progress]}
              onValueChange={handleProgressChange}
              max={100}
              step={5}
              className="mt-2"
            />
          </div>

          {/* Status Update */}
          <div className="space-y-2">
            <Label>Update Status</Label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Milestones */}
          {goal.milestones.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Milestones</h4>
              <div className="space-y-2">
                {goal.milestones.map((milestone) => (
                  <div 
                    key={milestone.id} 
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                  >
                    <Checkbox
                      checked={milestone.completed}
                      onCheckedChange={() => onToggleMilestone(goal.id, milestone.id)}
                    />
                    <span className={`text-sm flex-1 ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {milestone.title}
                    </span>
                    {milestone.completed && milestone.completed_at && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(milestone.completed_at), 'MMM d')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes about your progress, reflections, or next steps..."
              rows={4}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSaveNotes}
              disabled={saving || notes === goal.notes}
            >
              {saving ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Created: {format(new Date(goal.created_at), 'MMMM d, yyyy')}</p>
            <p>Last Updated: {format(new Date(goal.updated_at), 'MMMM d, yyyy')}</p>
          </div>

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Goal
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Goal?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your goal and all associated milestones.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  );
}
