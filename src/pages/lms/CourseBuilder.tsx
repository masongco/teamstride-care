import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  ArrowLeft,
  Plus,
  Video,
  FileText,
  FileCheck,
  HelpCircle,
  GripVertical,
  Edit,
  Trash2,
  MoreHorizontal,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCourseModules } from '@/hooks/useLMS';
import { Link } from 'react-router-dom';
import type { ModuleType, CourseModule } from '@/types/portal';

const MODULE_ICONS: Record<ModuleType, React.ElementType> = {
  video: Video,
  pdf: FileText,
  policy: FileCheck,
  quiz: HelpCircle,
};

const MODULE_LABELS: Record<ModuleType, string> = {
  video: 'Video',
  pdf: 'PDF/Document',
  policy: 'Policy Acknowledgement',
  quiz: 'Quiz',
};

export default function CourseBuilder() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { modules, loading, createModule, updateModule, deleteModule } = useCourseModules(courseId);
  
  const [course, setCourse] = useState<any>(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [moduleOpen, setModuleOpen] = useState(false);
  const [editModule, setEditModule] = useState<CourseModule | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    module_type: 'video' as ModuleType,
    content_url: '',
    content_text: '',
    duration_minutes: '',
    is_required: true,
  });

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (error) {
        console.error('Error fetching course:', error);
        navigate('/lms');
        return;
      }
      
      setCourse(data);
      setCourseLoading(false);
    };

    fetchCourse();
  }, [courseId, navigate]);

  const handleCreateModule = async () => {
    if (!courseId) return;
    
    const result = await createModule({
      course_id: courseId,
      title: formData.title,
      description: formData.description || null,
      module_type: formData.module_type,
      content_url: formData.content_url || null,
      content_text: formData.content_text || null,
      is_required: formData.is_required,
      display_order: modules.length,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
    });

    if (result) {
      setModuleOpen(false);
      resetForm();
    }
  };

  const handleUpdateModule = async () => {
    if (!editModule) return;
    
    await updateModule(editModule.id, {
      title: formData.title,
      description: formData.description || null,
      module_type: formData.module_type,
      content_url: formData.content_url || null,
      content_text: formData.content_text || null,
      is_required: formData.is_required,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
    });

    setEditModule(null);
    resetForm();
  };

  const handleDeleteModule = async (id: string) => {
    if (confirm('Are you sure you want to delete this module?')) {
      await deleteModule(id);
    }
  };

  const openEditModule = (module: CourseModule) => {
    setEditModule(module);
    setFormData({
      title: module.title,
      description: module.description || '',
      module_type: module.module_type,
      content_url: module.content_url || '',
      content_text: module.content_text || '',
      duration_minutes: module.duration_minutes?.toString() || '',
      is_required: module.is_required,
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      module_type: 'video',
      content_url: '',
      content_text: '',
      duration_minutes: '',
      is_required: true,
    });
  };

  if (courseLoading || loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!course) {
    return <div>Course not found</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/lms">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground">Course Builder - Add and arrange modules</p>
        </div>
        <Button onClick={() => setModuleOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Module
        </Button>
      </div>

      {/* Course Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant={course.is_published ? 'default' : 'secondary'}>
                {course.is_published ? 'Published' : 'Draft'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {modules.length} module{modules.length !== 1 ? 's' : ''}
              </span>
              {course.estimated_duration_minutes && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {course.estimated_duration_minutes} min total
                </span>
              )}
            </div>
            <Link to={`/lms/courses/${courseId}/quiz`}>
              <Button variant="outline" size="sm">
                <HelpCircle className="h-4 w-4 mr-2" />
                Manage Quiz Questions
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Modules List */}
      <Card>
        <CardHeader>
          <CardTitle>Course Modules</CardTitle>
          <CardDescription>Drag to reorder modules. Learners will complete them in order.</CardDescription>
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No modules yet</p>
              <p className="text-sm mt-1">Add your first module to start building the course</p>
              <Button className="mt-4" onClick={() => setModuleOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Module
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {modules.map((module, index) => {
                const Icon = MODULE_ICONS[module.module_type];
                return (
                  <div 
                    key={module.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="cursor-grab text-muted-foreground">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{module.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {MODULE_LABELS[module.module_type]}
                          </Badge>
                          {module.duration_minutes && (
                            <span>{module.duration_minutes} min</span>
                          )}
                          {module.is_required && (
                            <Badge variant="secondary" className="text-xs">Required</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditModule(module)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteModule(module.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Module Dialog */}
      <Dialog open={moduleOpen || !!editModule} onOpenChange={(open) => {
        if (!open) {
          setModuleOpen(false);
          setEditModule(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editModule ? 'Edit Module' : 'Add Module'}</DialogTitle>
            <DialogDescription>
              {editModule ? 'Update module details' : 'Add a new learning module to this course'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Module Type *</Label>
              <Select 
                value={formData.module_type} 
                onValueChange={(value: ModuleType) => setFormData({ ...formData, module_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Video
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      PDF/Document
                    </div>
                  </SelectItem>
                  <SelectItem value="policy">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4" />
                      Policy Acknowledgement
                    </div>
                  </SelectItem>
                  <SelectItem value="quiz">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Quiz
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Introduction to NDIS"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description..."
                rows={2}
              />
            </div>

            {(formData.module_type === 'video' || formData.module_type === 'pdf') && (
              <div className="space-y-2">
                <Label>Content URL *</Label>
                <Input
                  value={formData.content_url}
                  onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
                  placeholder={formData.module_type === 'video' ? 'https://youtube.com/...' : 'https://...'}
                />
              </div>
            )}

            {formData.module_type === 'policy' && (
              <div className="space-y-2">
                <Label>Policy Text *</Label>
                <Textarea
                  value={formData.content_text}
                  onChange={(e) => setFormData({ ...formData, content_text: e.target.value })}
                  placeholder="Enter the policy text that learners must acknowledge..."
                  rows={5}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  placeholder="10"
                />
              </div>
              <div className="space-y-2">
                <Label>Required</Label>
                <div className="flex items-center h-10">
                  <input
                    type="checkbox"
                    checked={formData.is_required}
                    onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span className="ml-2 text-sm">Must complete</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setModuleOpen(false);
              setEditModule(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={editModule ? handleUpdateModule : handleCreateModule}
              disabled={!formData.title}
            >
              {editModule ? 'Save Changes' : 'Add Module'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
