import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricCard } from '@/components/ui/metric-card';
import { 
  FileCheck, 
  GraduationCap, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileWarning,
  ArrowRight,
  Bell
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEmployeeDocuments, useDocumentTypes } from '@/hooks/useDocuments';
import { useUserCourseAssignments } from '@/hooks/useLMS';
import { format, differenceInDays, isPast, addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export default function PortalDashboard() {
  const { documents, loading: docsLoading } = useEmployeeDocuments();
  const { documentTypes } = useDocumentTypes();
  const { assignments, loading: trainingLoading } = useUserCourseAssignments();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.display_name || user.email?.split('@')[0] || 'User');
      }
    };
    getUser();
  }, []);

  const loading = docsLoading || trainingLoading;

  // Document stats
  const approvedDocs = documents.filter(d => d.status === 'approved').length;
  const pendingDocs = documents.filter(d => d.status === 'pending').length;
  const expiredDocs = documents.filter(d => d.status === 'expired' || (d.expiry_date && isPast(new Date(d.expiry_date)))).length;
  const expiringSoonDocs = documents.filter(d => {
    if (!d.expiry_date || d.status === 'expired') return false;
    const daysUntil = differenceInDays(new Date(d.expiry_date), new Date());
    return daysUntil <= 30 && daysUntil > 0;
  });
  const requiredTypes = documentTypes.filter(dt => dt.is_required);
  const missingDocs = requiredTypes.filter(rt => 
    !documents.some(d => d.document_type_id === rt.id && (d.status === 'approved' || d.status === 'pending'))
  );

  // Training stats
  const completedTraining = assignments.filter(a => a.status === 'completed').length;
  const inProgressTraining = assignments.filter(a => a.status === 'in_progress').length;
  const assignedTraining = assignments.filter(a => a.status === 'assigned').length;
  const overdueTraining = assignments.filter(a => {
    if (a.status === 'completed') return false;
    if (!a.due_date) return false;
    return isPast(new Date(a.due_date));
  });

  // Compliance calculation
  const totalRequired = requiredTypes.length;
  const compliantDocs = requiredTypes.filter(rt => 
    documents.some(d => d.document_type_id === rt.id && d.status === 'approved' && (!d.expiry_date || !isPast(new Date(d.expiry_date))))
  ).length;
  const documentCompliance = totalRequired > 0 ? Math.round((compliantDocs / totalRequired) * 100) : 100;
  
  const totalTraining = assignments.length;
  const trainingCompliance = totalTraining > 0 ? Math.round((completedTraining / totalTraining) * 100) : 100;
  
  const overallCompliance = Math.round((documentCompliance + trainingCompliance) / 2);

  // Priority alerts
  const alerts = [
    ...missingDocs.map(d => ({ 
      type: 'error' as const, 
      message: `Missing required document: ${d.name}`,
      link: '/portal/documents'
    })),
    ...expiredDocs > 0 ? [{ 
      type: 'error' as const, 
      message: `${expiredDocs} document(s) have expired`,
      link: '/portal/documents'
    }] : [],
    ...expiringSoonDocs.map(d => ({ 
      type: 'warning' as const, 
      message: `${d.document_type?.name || 'Document'} expires ${format(new Date(d.expiry_date!), 'dd MMM yyyy')}`,
      link: '/portal/documents'
    })),
    ...overdueTraining.map(t => ({ 
      type: 'error' as const, 
      message: `Overdue training: ${t.course?.title}`,
      link: '/portal/training'
    })),
    ...pendingDocs > 0 ? [{ 
      type: 'info' as const, 
      message: `${pendingDocs} document(s) awaiting review`,
      link: '/portal/documents'
    }] : [],
  ].slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {userName}</h1>
          <p className="text-muted-foreground mt-1">
            Your self-service portal for documents and training
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={overallCompliance >= 80 ? 'default' : overallCompliance >= 50 ? 'secondary' : 'destructive'}
            className={overallCompliance >= 80 ? 'bg-success/10 text-success' : ''}
          >
            {overallCompliance}% Compliant
          </Badge>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Documents"
          value={approvedDocs}
          description={`${pendingDocs} pending review`}
          icon={FileCheck}
          variant={missingDocs.length > 0 || expiredDocs > 0 ? 'warning' : 'success'}
        />
        <MetricCard
          title="Training Completed"
          value={completedTraining}
          description={`${assignedTraining + inProgressTraining} remaining`}
          icon={GraduationCap}
          variant={overdueTraining.length > 0 ? 'warning' : 'success'}
        />
        <MetricCard
          title="Expiring Soon"
          value={expiringSoonDocs.length}
          description="Within 30 days"
          icon={Clock}
          variant={expiringSoonDocs.length > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Action Required"
          value={missingDocs.length + overdueTraining.length + expiredDocs}
          description="Items need attention"
          icon={AlertTriangle}
          variant={missingDocs.length + overdueTraining.length + expiredDocs > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Priority Alerts
              </CardTitle>
              <CardDescription>Items requiring your attention</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert, i) => (
                  <Link 
                    key={i} 
                    to={alert.link}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    {alert.type === 'error' ? (
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    ) : alert.type === 'warning' ? (
                      <FileWarning className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="h-5 w-5 text-info shrink-0 mt-0.5" />
                    )}
                    <span className="text-sm flex-1">{alert.message}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-12 w-12 text-success mb-3" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm text-muted-foreground">No urgent items require your attention</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compliance Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Compliance Overview</CardTitle>
            <CardDescription>Your current compliance status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Document Compliance */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Document Compliance</span>
                <span className="text-sm text-muted-foreground">{documentCompliance}%</span>
              </div>
              <Progress value={documentCompliance} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {compliantDocs} of {totalRequired} required documents uploaded
              </p>
            </div>

            {/* Training Compliance */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Training Compliance</span>
                <span className="text-sm text-muted-foreground">{trainingCompliance}%</span>
              </div>
              <Progress value={trainingCompliance} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {completedTraining} of {totalTraining} assigned training completed
              </p>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link to="/portal/documents">
                  <FileCheck className="h-4 w-4 mr-2" />
                  My Documents
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/portal/training">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  My Training
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Progress */}
      {assignments.filter(a => a.status === 'in_progress').length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Continue Training</CardTitle>
            <CardDescription>Pick up where you left off</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignments.filter(a => a.status === 'in_progress').slice(0, 3).map(assignment => (
                <div key={assignment.id} className="flex items-center gap-4 p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{assignment.course?.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={assignment.progress_percentage} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground">{assignment.progress_percentage}%</span>
                    </div>
                  </div>
                  <Button asChild size="sm">
                    <Link to={`/portal/training/${assignment.id}`}>Resume</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
