import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  ClipboardCheck, 
  Target, 
  Search,
  BarChart3,
  Star
} from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import { SupervisionsTab } from '@/components/performance/SupervisionsTab';
import { ReviewsTab } from '@/components/performance/ReviewsTab';
import { CompetenciesTab } from '@/components/performance/CompetenciesTab';
import { AnalyticsTab } from '@/components/performance/AnalyticsTab';
import { useSupervisions, usePerformanceReviews, useCompetencies } from '@/hooks/usePerformance';

export default function Performance() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { supervisions, loading: supervisionsLoading } = useSupervisions();
  const { reviews, loading: reviewsLoading } = usePerformanceReviews();
  const { competencies, loading: competenciesLoading } = useCompetencies();

  const activeSupervisions = supervisions.filter(s => s.is_active).length;
  const pendingReviews = reviews.filter(r => r.status === 'in_progress' || r.status === 'pending_approval').length;
  const completedReviews = reviews.filter(r => r.status === 'completed').length;
  const avgRating = reviews.filter(r => r.overall_rating).length > 0
    ? (reviews.filter(r => r.overall_rating).reduce((sum, r) => sum + (r.overall_rating || 0), 0) / 
       reviews.filter(r => r.overall_rating).length).toFixed(1)
    : 'N/A';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Performance Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage supervisions, performance reviews, and competency assessments
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Supervisions"
          value={activeSupervisions}
          description="Current assignments"
          icon={Users}
          variant="default"
        />
        <MetricCard
          title="Pending Reviews"
          value={pendingReviews}
          description="Awaiting completion"
          icon={ClipboardCheck}
          variant="info"
        />
        <MetricCard
          title="Completed Reviews"
          value={completedReviews}
          description="This year"
          icon={Target}
          variant="success"
        />
        <MetricCard
          title="Average Rating"
          value={avgRating}
          description="Out of 5.0"
          icon={Star}
          variant="default"
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search supervisions, reviews, or competencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="supervisions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Supervisions</span>
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Reviews</span>
          </TabsTrigger>
          <TabsTrigger value="competencies" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Competencies</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>

        <TabsContent value="supervisions">
          <SupervisionsTab searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="reviews">
          <ReviewsTab searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="competencies">
          <CompetenciesTab searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
