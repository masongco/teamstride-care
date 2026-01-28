import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CreateJobDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function CreateJobDialog({ open, onOpenChange, trigger }: CreateJobDialogProps) {
  const [requirements, setRequirements] = useState<string[]>([]);
  const [newRequirement, setNewRequirement] = useState('');

  // Fetch departments from Supabase (same source as Settings)
  const { data: departments = [], isLoading: loadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setRequirements([...requirements, newRequirement.trim()]);
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Job Posting</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new job listing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job-title">Job Title *</Label>
              <Input id="job-title" placeholder="e.g. Support Worker" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {loadingDepartments ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : departments.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No departments configured
                    </div>
                  ) : (
                    departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input id="location" placeholder="e.g. Melbourne, VIC" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employment-type">Employment Type *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="part_time">Part-Time</SelectItem>
                  <SelectItem value="full_time">Full-Time</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pay Rate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pay-min">Minimum Pay Rate ($/hr)</Label>
              <Input id="pay-min" type="number" placeholder="35" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-max">Maximum Pay Rate ($/hr)</Label>
              <Input id="pay-max" type="number" placeholder="45" />
            </div>
          </div>

          {/* Closing Date */}
          <div className="space-y-2">
            <Label htmlFor="closing-date">Closing Date</Label>
            <Input id="closing-date" type="date" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Job Description *</Label>
            <Textarea 
              id="description" 
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              className="min-h-[120px]"
            />
          </div>

          {/* Requirements */}
          <div className="space-y-2">
            <Label>Requirements</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a requirement..."
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
              />
              <Button type="button" onClick={addRequirement} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {requirements.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {requirements.map((req, index) => (
                  <Badge key={index} variant="secondary" className="pl-3 pr-1 py-1.5">
                    {req}
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange?.(false)}>
              Save as Draft
            </Button>
            <Button className="flex-1 gradient-primary">
              Publish Job
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
