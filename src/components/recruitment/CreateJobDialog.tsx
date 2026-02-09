import { useMemo, useState } from 'react';
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

// Avoid TypeScript "excessively deep" instantiation from generated Supabase types
const db = supabase as any;

type JobStatus = 'draft' | 'active' | 'paused' | 'closed';

type DepartmentRow = {
  id: string;
  name: string;
};

interface CreateJobDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function CreateJobDialog({ open, onOpenChange, trigger }: CreateJobDialogProps) {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState<string>('');
  const [description, setDescription] = useState('');

  const [requirements, setRequirements] = useState<string[]>([]);
  const [newRequirement, setNewRequirement] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch departments from Supabase (same source as Settings)
  const { data: departments = [], isLoading: loadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: async (): Promise<DepartmentRow[]> => {
      const { data, error } = await db.from('departments').select('id, name').order('name');
      if (error) throw error;
      return (data ?? []) as any;
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

  const reset = () => {
    setTitle('');
    setDepartment('');
    setDescription('');
    setRequirements([]);
    setNewRequirement('');
    setError(null);
  };

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && department.trim().length > 0 && !submitting;
  }, [title, department, submitting]);

  const loadOrganisationId = async (): Promise<string> => {
    const { data: sessionData, error: sessionErr } = await db.auth.getSession();
    if (sessionErr) throw sessionErr;

    const user = sessionData.session?.user;
    if (!user) throw new Error('Not authenticated');

    const { data: organisationId, error: orgErr } = await db.rpc(
      'get_user_organisation_id',
      { _user_id: user.id },
    );
    if (orgErr) throw orgErr;
    if (!organisationId) throw new Error('Missing organisation_id for user');

    return organisationId;
  };

  const buildFullDescription = () => {
    const base = description.trim();
    if (requirements.length === 0) return base;

    const reqBlock = requirements.map((r) => `- ${r}`).join('\n');

    // If no description yet, just return requirements block.
    if (!base) return `Requirements:\n${reqBlock}`;

    // Append requirements.
    return `${base}\n\nRequirements:\n${reqBlock}`;
  };

  const createJob = async (status: JobStatus) => {
    setError(null);
    setSubmitting(true);
    try {
      const orgId = await loadOrganisationId();

      const payload = {
        organisation_id: orgId,
        title: title.trim(),
        department: department.trim() || null,
        status,
        // NOTE: If your table has a `description` column, keep this.
        // If it doesn't, remove this line.
        description: buildFullDescription() || null,
      };

      const { error: insErr } = await db.from('recruitment_job_postings').insert(payload);
      if (insErr) throw insErr;

      reset();
      onOpenChange?.(false);
    } catch (e: any) {
      // Common case: table doesn't have `description` column.
      if (String(e?.message ?? '').toLowerCase().includes('column') && String(e?.message ?? '').toLowerCase().includes('description')) {
        setError(
          "Your `recruitment_job_postings` table doesn't have a `description` column. Either add it, or tell me what column should store the description."
        );
      } else {
        setError(e?.message ?? 'Failed to create job posting');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange?.(v);
        if (!v) reset();
      }}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Job Posting</DialogTitle>
          <DialogDescription>Fill in the details to create a new job listing.</DialogDescription>
        </DialogHeader>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job-title">Job Title *</Label>
              <Input
                id="job-title"
                placeholder="e.g. Support Worker"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {loadingDepartments ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : departments.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No departments configured</div>
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Job Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              className="min-h-[120px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addRequirement();
                  }
                }}
              />
              <Button type="button" onClick={addRequirement} variant="outline" disabled={submitting}>
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
                      disabled={submitting}
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
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => createJob('draft')}
              disabled={!canSubmit}
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save as Draft
            </Button>
            <Button className="flex-1 gradient-primary" onClick={() => createJob('active')} disabled={!canSubmit}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Publish Job
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
