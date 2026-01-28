import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePerformanceAnalytics } from '@/hooks/usePerformanceAnalytics';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { TrendingUp, Target, Users, CheckCircle } from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';

const STATUS_COLORS: Record<string, string> = {
  draft: 'hsl(var(--muted-foreground))',
  in_progress: 'hsl(var(--info))',
  pending_approval: 'hsl(var(--warning))',
  completed: 'hsl(var(--success))',
};

const PIE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--info))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
];

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  pending_approval: 'Pending Approval',
  completed: 'Completed',
};

const TYPE_LABELS: Record<string, string> = {
  performance: 'Performance',
  annual: 'Annual',
  probation: 'Probation',
};

export function AnalyticsTab() {
  const {
    competencyScores,
    reviewStatusCounts,
    reviewTypeCounts,
    monthlyTrends,
    departmentPerformance,
    loading,
  } = usePerformanceAnalytics();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  // Calculate summary metrics
  const totalReviews = reviewStatusCounts.reduce((sum, s) => sum + s.count, 0);
  const completedReviews = reviewStatusCounts.find(s => s.status === 'completed')?.count || 0;
  const completionRate = totalReviews > 0 ? Math.round((completedReviews / totalReviews) * 100) : 0;
  const avgCompetencyScore = competencyScores.length > 0
    ? (competencyScores.reduce((sum, c) => sum + c.average_rating, 0) / competencyScores.filter(c => c.average_rating > 0).length || 0).toFixed(1)
    : '0';
  const totalRatings = competencyScores.reduce((sum, c) => sum + c.total_ratings, 0);

  // Prepare radar chart data for competencies
  const radarData = competencyScores
    .filter(c => c.average_rating > 0)
    .map(c => ({
      competency: c.competency_name.length > 15 
        ? c.competency_name.substring(0, 15) + '...' 
        : c.competency_name,
      fullName: c.competency_name,
      score: c.average_rating,
      fullMark: 5,
    }));

  // Format status data for pie chart
  const pieData = reviewStatusCounts.map(s => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count,
    status: s.status,
  }));

  // Format type data
  const typeData = reviewTypeCounts.map(t => ({
    name: TYPE_LABELS[t.review_type] || t.review_type,
    count: t.count,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Reviews"
          value={totalReviews}
          description="All time reviews"
          icon={Target}
          variant="default"
        />
        <MetricCard
          title="Completion Rate"
          value={`${completionRate}%`}
          description={`${completedReviews} of ${totalReviews} completed`}
          icon={CheckCircle}
          variant="success"
        />
        <MetricCard
          title="Avg Competency Score"
          value={avgCompetencyScore}
          description="Out of 5.0"
          icon={TrendingUp}
          variant="info"
        />
        <MetricCard
          title="Total Ratings"
          value={totalRatings}
          description="Competency assessments"
          icon={Users}
          variant="default"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Review Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review Status Distribution</CardTitle>
            <CardDescription>Current status of all performance reviews</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={STATUS_COLORS[entry.status] || PIE_COLORS[index % PIE_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No review data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Review Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Review Trends</CardTitle>
            <CardDescription>Review activity over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="hsl(var(--success))" 
                    name="Completed"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="in_progress" 
                    stroke="hsl(var(--info))" 
                    name="In Progress"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pending" 
                    stroke="hsl(var(--warning))" 
                    name="Pending/Draft"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Competency Scores Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Competency Scores</CardTitle>
            <CardDescription>Average ratings across all competencies</CardDescription>
          </CardHeader>
          <CardContent>
            {radarData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid className="stroke-border" />
                    <PolarAngleAxis 
                      dataKey="competency" 
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 10 }}
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 5]} 
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 10 }}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string, props: any) => [
                        `${value.toFixed(2)} / 5.0`,
                        props.payload.fullName
                      ]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                No competency ratings available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviews by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reviews by Type</CardTitle>
            <CardDescription>Distribution of review types</CardDescription>
          </CardHeader>
          <CardContent>
            {typeData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      type="number" 
                      className="text-xs fill-muted-foreground"
                      allowDecimals={false}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      className="text-xs fill-muted-foreground"
                      width={100}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }} 
                    />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]}
                      name="Reviews"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                No review data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Department Performance */}
      {departmentPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Department Performance</CardTitle>
            <CardDescription>Average ratings by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentPerformance}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="department" 
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis 
                    domain={[0, 5]} 
                    className="text-xs fill-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)} / 5.0`, 'Avg Rating']}
                  />
                  <Bar 
                    dataKey="average_rating" 
                    fill="hsl(var(--info))" 
                    radius={[4, 4, 0, 0]}
                    name="Average Rating"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competency Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Competency Breakdown</CardTitle>
          <CardDescription>Detailed scores for each competency</CardDescription>
        </CardHeader>
        <CardContent>
          {competencyScores.length > 0 ? (
            <div className="space-y-3">
              {competencyScores.map(comp => (
                <div key={comp.competency_id} className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{comp.competency_name}</p>
                    {comp.category && (
                      <p className="text-xs text-muted-foreground">{comp.category}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${(comp.average_rating / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {comp.average_rating > 0 ? comp.average_rating.toFixed(1) : '—'}
                    </span>
                    <span className="text-xs text-muted-foreground w-16">
                      ({comp.total_ratings} ratings)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No competency data available yet. Start creating performance reviews with competency ratings.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
