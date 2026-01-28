import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  GraduationCap, 
  Play, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  Search,
  Filter,
  BookOpen,
  Calendar,
  Timer
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserCourseAssignments } from '@/hooks/useLMS';
import { format, isPast, differenceInDays } from 'date-fns';
import type { AssignmentStatus, UserCourseAssignment } from '@/types/portal';

const STATUS_CONFIG: Record<AssignmentStatus, { label: string; icon: React.ElementType; className: string }> = {
  assigned: { label: 'Not Started', icon: BookOpen, className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In Progress', icon: Play, className: 'bg-info/10 text-info' },
  completed: { label: 'Completed', icon: CheckCircle, className: 'bg-success/10 text-success' },
  overdue: { label: 'Overdue', icon: AlertTriangle, className: 'bg-destructive/10 text-destructive' },
};

export default function MyTraining() {
  const { assignments, loading, startCourse } = useUserCourseAssignments();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  const getEffectiveStatus = (assignment: UserCourseAssignment): AssignmentStatus => {
    if (assignment.status === 'completed') return 'completed';
    if (assignment.due_date && isPast(new Date(assignment.due_date))) return 'overdue';
    return assignment.status;
  };

  const getDueInfo = (assignment: UserCourseAssignment) => {
    if (!assignment.due_date) return null;
    if (assignment.status === 'completed') return null;
    
    const days = differenceInDays(new Date(assignment.due_date), new Date());
    if (days < 0) return { text: `${Math.abs(days)} days overdue`, className: 'text-destructive' };
    if (days === 0) return { text: 'Due today', className: 'text-warning' };
    if (days <= 7) return { text: `Due in ${days} days`, className: 'text-warning' };
    return { text: `Due ${format(new Date(assignment.due_date), 'dd MMM yyyy')}`, className: 'text-muted-foreground' };
  };

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.course?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.course?.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const effectiveStatus = getEffectiveStatus(assignment);
    const matchesStatus = statusFilter === 'all' || effectiveStatus === statusFilter;
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'active' && (effectiveStatus === 'assigned' || effectiveStatus === 'in_progress' || effectiveStatus === 'overdue')) ||
      (activeTab === 'completed' && effectiveStatus === 'completed');
    return matchesSearch && matchesStatus && matchesTab;
  });

  const handleStartCourse = async (assignment: UserCourseAssignment) => {
    await startCourse(assignment.id);
  };

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

  // Stats
  const activeCount = assignments.filter(a => {
    const status = getEffectiveStatus(a);
    return status === 'assigned' || status === 'in_progress' || status === 'overdue';
  }).length;
  const completedCount = assignments.filter(a => a.status === 'completed').length;
  const overdueCount = assignments.filter(a => getEffectiveStatus(a) === 'overdue').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Training</h1>
          <p className="text-muted-foreground mt-1">
            Complete your assigned courses and track your progress
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{activeCount} Active</Badge>
            <Badge className="bg-success/10 text-success">{completedCount} Completed</Badge>
            {overdueCount > 0 && (
              <Badge className="bg-destructive/10 text-destructive">{overdueCount} Overdue</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-[200px]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="assigned">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-6">
          {filteredAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No training courses found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeTab === 'completed' 
                    ? 'Complete some courses to see them here'
                    : 'Check back later for new assignments'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssignments.map(assignment => {
                const effectiveStatus = getEffectiveStatus(assignment);
                const statusConfig = STATUS_CONFIG[effectiveStatus];
                const dueInfo = getDueInfo(assignment);
                const course = assignment.course;

                return (
                  <Card key={assignment.id} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base line-clamp-2">{course?.title}</CardTitle>
                        <Badge className={statusConfig.className}>
                          <statusConfig.icon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      {course?.description && (
                        <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1 text-sm">
                          <span>Progress</span>
                          <span className="font-medium">{assignment.progress_percentage}%</span>
                        </div>
                        <Progress value={assignment.progress_percentage} className="h-2" />
                      </div>

                      {/* Meta */}
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        {course?.estimated_duration_minutes && (
                          <div className="flex items-center gap-2">
                            <Timer className="h-4 w-4" />
                            <span>{course.estimated_duration_minutes} min estimated</span>
                          </div>
                        )}
                        {dueInfo && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className={dueInfo.className}>{dueInfo.text}</span>
                          </div>
                        )}
                        {assignment.completed_at && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-success" />
                            <span>Completed {format(new Date(assignment.completed_at), 'dd MMM yyyy')}</span>
                          </div>
                        )}
                      </div>

                      {/* Action */}
                      <div className="mt-auto">
                        {effectiveStatus === 'assigned' ? (
                          <Button 
                            className="w-full"
                            onClick={() => handleStartCourse(assignment)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start Course
                          </Button>
                        ) : effectiveStatus === 'in_progress' || effectiveStatus === 'overdue' ? (
                          <Button asChild className="w-full">
                            <Link to={`/portal/training/${assignment.id}`}>
                              <Play className="h-4 w-4 mr-2" />
                              Continue
                            </Link>
                          </Button>
                        ) : (
                          <Button variant="outline" asChild className="w-full">
                            <Link to={`/portal/training/${assignment.id}`}>
                              View Certificate
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
