import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gavel, Plus, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { 
  HRCaseAction, 
  CreateActionInput, 
  UpdateActionInput, 
  HRActionType, 
  HRActionStatus,
  ACTION_TYPE_LABELS,
  ACTION_STATUS_LABELS,
} from '@/types/hrCases';

interface CaseActionsTabProps {
  actions: HRCaseAction[];
  onAddAction: (input: Omit<CreateActionInput, 'hr_case_id'>) => Promise<boolean>;
  onUpdateAction: (actionId: string, input: UpdateActionInput) => Promise<boolean>;
}

const ACTION_TYPES: { value: HRActionType; label: string }[] = [
  { value: 'verbal_warning', label: 'Verbal Warning' },
  { value: 'written_warning', label: 'Written Warning' },
  { value: 'final_warning', label: 'Final Warning' },
  { value: 'training', label: 'Training Required' },
  { value: 'supervision', label: 'Increased Supervision' },
  { value: 'termination', label: 'Termination' },
  { value: 'no_action', label: 'No Action' },
  { value: 'other', label: 'Other' },
];

const WARNING_TYPES: HRActionType[] = ['verbal_warning', 'written_warning', 'final_warning'];

export function CaseActionsTab({ actions, onAddAction, onUpdateAction }: CaseActionsTabProps) {
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<Omit<CreateActionInput, 'hr_case_id'>>({
    defaultValues: {
      action_type: 'no_action',
      description: '',
      effective_date: new Date().toISOString().split('T')[0],
    },
  });

  const actionType = watch('action_type');
  const isWarning = WARNING_TYPES.includes(actionType);

  const handleFormSubmit = async (data: Omit<CreateActionInput, 'hr_case_id'>) => {
    setLoading(true);
    try {
      const success = await onAddAction(data);
      if (success) {
        setAdding(false);
        reset();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (actionId: string, status: HRActionStatus) => {
    await onUpdateAction(actionId, { status });
  };

  const getActionColor = (type: HRActionType) => {
    switch (type) {
      case 'termination': return 'bg-red-500 text-white';
      case 'final_warning': return 'bg-orange-500 text-white';
      case 'written_warning': return 'bg-amber-500 text-black';
      case 'verbal_warning': return 'bg-yellow-400 text-black';
      case 'training': return 'bg-blue-500 text-white';
      case 'supervision': return 'bg-purple-500 text-white';
      case 'no_action': return 'bg-green-500 text-white';
      default: return 'bg-muted';
    }
  };

  const getStatusIcon = (status: HRActionStatus) => {
    switch (status) {
      case 'planned': return <Clock className="h-3 w-3" />;
      case 'active': return <AlertTriangle className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'withdrawn': return <XCircle className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Disciplinary Actions</h3>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Action
          </Button>
        )}
      </div>

      {adding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Disciplinary Action</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="action_type">Action Type *</Label>
                <Select
                  value={actionType}
                  onValueChange={(value) => setValue('action_type', value as HRActionType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  {...register('description', { required: 'Description is required' })}
                  placeholder="Describe the action and expectations..."
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="effective_date">Effective Date *</Label>
                  <Input
                    id="effective_date"
                    type="date"
                    {...register('effective_date', { required: true })}
                  />
                </div>

                {isWarning && (
                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Expiry Date *</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      {...register('expiry_date', { 
                        required: isWarning ? 'Warnings must have an expiry date' : false 
                      })}
                    />
                    {errors.expiry_date && (
                      <p className="text-sm text-destructive">{errors.expiry_date.message}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_to_name">Assigned To</Label>
                <Input
                  id="assigned_to_name"
                  {...register('assigned_to_name')}
                  placeholder="Name of person responsible for follow-up"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Action'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {actions.length === 0 && !adding && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Gavel className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No actions recorded yet</p>
          </CardContent>
        </Card>
      )}

      {actions.map((action) => (
        <Card key={action.id}>
          <CardContent className="py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getActionColor(action.action_type)}>
                    {ACTION_TYPES.find(t => t.value === action.action_type)?.label}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getStatusIcon(action.status)}
                    {action.status.charAt(0).toUpperCase() + action.status.slice(1)}
                  </Badge>
                </div>
                
                <p className="text-sm mb-2">{action.description}</p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    Effective: {format(new Date(action.effective_date), 'dd MMM yyyy')}
                  </span>
                  {action.expiry_date && (
                    <span>
                      Expires: {format(new Date(action.expiry_date), 'dd MMM yyyy')}
                    </span>
                  )}
                  {action.assigned_to_name && (
                    <span>Assigned to: {action.assigned_to_name}</span>
                  )}
                </div>
              </div>

              {action.status !== 'completed' && action.status !== 'withdrawn' && (
                <Select
                  value={action.status}
                  onValueChange={(value) => handleStatusChange(action.id, value as HRActionStatus)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
