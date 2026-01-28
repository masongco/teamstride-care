import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, 
  Plus, 
  Trash2,
  Calendar,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { useCourseAssignments, useCourses } from '@/hooks/useLMS';
import { format } from 'date-fns';
import type { AssignmentTargetType, RecurrenceType } from '@/types/portal';

const TARGET_LABELS: Record<AssignmentTargetType, string> = {
  individual: 'Individual',
  team: 'Team',
  role: 'Role',
  department: 'Department',
  location: 'Location',
  all: 'All Staff',
};

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  none: 'One-time',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  biannual: 'Every 6 months',
  annual: 'Annually',
};

export default function AssignmentManager() {
  const { assignments, loading, createAssignment, deleteAssignment } = useCourseAssignments();
  const { courses } = useCourses();
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    course_id: '',
    target_type: 'all' as AssignmentTargetType,
    target_value: '',
    due_date: '',
    recurrence: 'none' as RecurrenceType,
    is_mandatory: true,
    auto_assign_on_hire: false,
    notes: '',
  });

  const handleCreate = async () => {
    const result = await createAssignment({
      course_id: formData.course_id,
      target_type: formData.target_type,
      target_value: formData.target_type === 'all' ? null : formData.target_value || null,
      due_date: formData.due_date || null,
      recurrence: formData.recurrence,
      is_mandatory: formData.is_mandatory,
      auto_assign_on_hire: formData.auto_assign_on_hire,
      notes: formData.notes || null,
      assigned_by: null,
      assigned_by_name: null,
    });

    if (result) {
      setCreateOpen(false);
      setFormData({
        course_id: '',
        target_type: 'all',
        target_value: '',
        due_date: '',
        recurrence: 'none',
        is_mandatory: true,
        auto_assign_on_hire: false,
        notes: '',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      await deleteAssignment(id);
    }
  };

  const filteredAssignments = assignments.filter(a => 
    a.course?.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Training Assignments</h1>
          <p className="text-muted-foreground mt-1">
            Assign courses to individuals, teams, or all staff
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Assignment
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search assignments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Assignments Table */}
      <Card>
        <CardContent className="p-0">
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No assignments found</p>
              <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first assignment
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Recurrence</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Assigned By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map(assignment => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.course?.title || 'Unknown Course'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TARGET_LABELS[assignment.target_type]}
                        {assignment.target_value && `: ${assignment.target_value}`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assignment.due_date ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(assignment.due_date), 'dd MMM yyyy')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No deadline</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                        {RECURRENCE_LABELS[assignment.recurrence]}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={assignment.is_mandatory ? 'default' : 'secondary'}>
                        {assignment.is_mandatory ? 'Mandatory' : 'Optional'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {assignment.assigned_by_name || 'System'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(assignment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Assignment</DialogTitle>
            <DialogDescription>
              Assign a course to staff members
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Course *</Label>
              <Select 
                value={formData.course_id} 
                onValueChange={(value) => setFormData({ ...formData, course_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.filter(c => c.is_published).map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assign To *</Label>
              <Select 
                value={formData.target_type} 
                onValueChange={(value: AssignmentTargetType) => setFormData({ ...formData, target_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  <SelectItem value="role">By Role</SelectItem>
                  <SelectItem value="department">By Department</SelectItem>
                  <SelectItem value="location">By Location</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.target_type !== 'all' && (
              <div className="space-y-2">
                <Label>
                  {formData.target_type === 'individual' ? 'User Email' : 
                   formData.target_type === 'role' ? 'Role Name' :
                   formData.target_type === 'department' ? 'Department' : 'Location'}
                </Label>
                <Input
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  placeholder={formData.target_type === 'individual' ? 'user@example.com' : 'Enter value...'}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Recurrence</Label>
                <Select 
                  value={formData.recurrence} 
                  onValueChange={(value: RecurrenceType) => setFormData({ ...formData, recurrence: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">One-time</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="biannual">Every 6 months</SelectItem>
                    <SelectItem value="annual">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_mandatory}
                  onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                />
                <span className="text-sm">Mandatory</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.auto_assign_on_hire}
                  onChange={(e) => setFormData({ ...formData, auto_assign_on_hire: e.target.checked })}
                />
                <span className="text-sm">Auto-assign new hires</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!formData.course_id}
            >
              Create Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
