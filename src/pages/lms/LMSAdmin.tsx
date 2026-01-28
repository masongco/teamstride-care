import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  GraduationCap, 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Upload,
  Clock,
  Users,
  BookOpen,
  Search
} from 'lucide-react';
import { useCourses } from '@/hooks/useLMS';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function LMSAdmin() {
  const { courses, loading, createCourse, updateCourse, deleteCourse, publishCourse } = useCourses();
  const [createOpen, setCreateOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    estimated_duration_minutes: '',
    pass_mark: '80',
  });

  const handleCreate = async () => {
    const result = await createCourse({
      title: formData.title,
      description: formData.description || null,
      thumbnail_url: null,
      estimated_duration_minutes: formData.estimated_duration_minutes ? parseInt(formData.estimated_duration_minutes) : null,
      pass_mark: parseInt(formData.pass_mark) || 80,
      is_published: false,
      is_active: true,
      created_by: null,
    });

    if (result) {
      setCreateOpen(false);
      setFormData({ title: '', description: '', estimated_duration_minutes: '', pass_mark: '80' });
    }
  };

  const handleUpdate = async () => {
    if (!editCourse) return;
    
    await updateCourse(editCourse.id, {
      title: formData.title,
      description: formData.description || null,
      estimated_duration_minutes: formData.estimated_duration_minutes ? parseInt(formData.estimated_duration_minutes) : null,
      pass_mark: parseInt(formData.pass_mark) || 80,
    });

    setEditCourse(null);
    setFormData({ title: '', description: '', estimated_duration_minutes: '', pass_mark: '80' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this course?')) {
      await deleteCourse(id);
    }
  };

  const openEdit = (course: any) => {
    setEditCourse(course);
    setFormData({
      title: course.title,
      description: course.description || '',
      estimated_duration_minutes: course.estimated_duration_minutes?.toString() || '',
      pass_mark: course.pass_mark?.toString() || '80',
    });
  };

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'published' && course.is_published) ||
      (activeTab === 'draft' && !course.is_published);
    return matchesSearch && matchesTab;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Learning Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage training courses
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Course
        </Button>
      </div>

      {/* Tabs & Search */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Courses ({courses.length})</TabsTrigger>
            <TabsTrigger value="published">Published ({courses.filter(c => c.is_published).length})</TabsTrigger>
            <TabsTrigger value="draft">Drafts ({courses.filter(c => !c.is_published).length})</TabsTrigger>
          </TabsList>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-[250px]"
            />
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-6">
          {filteredCourses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No courses found</p>
                <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first course
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map(course => (
                <Card key={course.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base line-clamp-2">{course.title}</CardTitle>
                        {course.description && (
                          <CardDescription className="line-clamp-2 mt-1">{course.description}</CardDescription>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/lms/courses/${course.id}`}>
                              <BookOpen className="h-4 w-4 mr-2" />
                              Edit Modules
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(course)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(course.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      {course.estimated_duration_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {course.estimated_duration_minutes} min
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span>Pass: {course.pass_mark}%</span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between mt-auto pt-4 border-t">
                      <Badge 
                        variant={course.is_published ? 'default' : 'secondary'}
                        className={course.is_published ? 'bg-success/10 text-success' : ''}
                      >
                        {course.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={course.is_published}
                          onCheckedChange={(checked) => publishCourse(course.id, checked)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {course.is_published ? 'Live' : 'Publish'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={createOpen || !!editCourse} onOpenChange={(open) => {
        if (!open) {
          setCreateOpen(false);
          setEditCourse(null);
          setFormData({ title: '', description: '', estimated_duration_minutes: '', pass_mark: '80' });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
            <DialogDescription>
              {editCourse ? 'Update course details' : 'Add a new training course to the LMS'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Course Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., NDIS Orientation Training"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the course content..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estimated Duration (minutes)</Label>
                <Input
                  type="number"
                  value={formData.estimated_duration_minutes}
                  onChange={(e) => setFormData({ ...formData, estimated_duration_minutes: e.target.value })}
                  placeholder="60"
                />
              </div>
              <div className="space-y-2">
                <Label>Quiz Pass Mark (%)</Label>
                <Input
                  type="number"
                  value={formData.pass_mark}
                  onChange={(e) => setFormData({ ...formData, pass_mark: e.target.value })}
                  placeholder="80"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateOpen(false);
              setEditCourse(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={editCourse ? handleUpdate : handleCreate}
              disabled={!formData.title}
            >
              {editCourse ? 'Save Changes' : 'Create Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
