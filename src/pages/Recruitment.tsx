import { useState } from 'react';
import { 
  Plus, Briefcase, Users, UserCheck, ClipboardCheck, 
  Search, Filter, LayoutGrid, List 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MetricCard } from '@/components/ui/metric-card';
import { JobPostingCard } from '@/components/recruitment/JobPostingCard';
import { ApplicantPipeline } from '@/components/recruitment/ApplicantPipeline';
import { ApplicantDetailSheet } from '@/components/recruitment/ApplicantDetailSheet';
import { OnboardingChecklist } from '@/components/recruitment/OnboardingChecklist';
import { CreateJobDialog } from '@/components/recruitment/CreateJobDialog';
import { OfferLetterDialog } from '@/components/recruitment/OfferLetterDialog';
import { 
  mockJobPostings, 
  mockApplicants, 
  mockOnboardingProgress,
  getApplicantsByJob 
} from '@/lib/mock-recruitment';
import { Applicant, JobPosting, ApplicantStage } from '@/types/recruitment';

export default function Recruitment() {
  const [activeTab, setActiveTab] = useState('jobs');
  const [selectedJob, setSelectedJob] = useState<string>('all');
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [applicantSheetOpen, setApplicantSheetOpen] = useState(false);
  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [offerLetterOpen, setOfferLetterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate metrics
  const activeJobs = mockJobPostings.filter(j => j.status === 'active').length;
  const totalApplicants = mockApplicants.length;
  const inPipeline = mockApplicants.filter(a => 
    !['hired', 'rejected'].includes(a.stage)
  ).length;
  const onboardingCount = mockOnboardingProgress.length;

  // Filter applicants based on selected job
  const filteredApplicants = selectedJob === 'all' 
    ? mockApplicants.filter(a => !['hired', 'rejected'].includes(a.stage))
    : getApplicantsByJob(selectedJob).filter(a => !['hired', 'rejected'].includes(a.stage));

  const handleSelectApplicant = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setApplicantSheetOpen(true);
  };

  const handleMoveApplicant = (applicant: Applicant, newStage: ApplicantStage) => {
    // In a real app, this would update the backend
    console.log(`Moving ${applicant.firstName} to ${newStage}`);
    if (newStage === 'offer') {
      setSelectedApplicant(applicant);
      setOfferLetterOpen(true);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Recruitment & Onboarding</h1>
          <p className="text-muted-foreground mt-1">
            Manage job postings, track applicants, and onboard new hires.
          </p>
        </div>
        <Button className="gradient-primary" onClick={() => setCreateJobOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Post New Job
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Jobs"
          value={activeJobs}
          description="Open positions"
          icon={Briefcase}
          variant="default"
        />
        <MetricCard
          title="Total Applicants"
          value={totalApplicants}
          description="All time"
          icon={Users}
          variant="info"
        />
        <MetricCard
          title="In Pipeline"
          value={inPipeline}
          description="Currently reviewing"
          icon={UserCheck}
          variant="warning"
        />
        <MetricCard
          title="Onboarding"
          value={onboardingCount}
          description="New hires in progress"
          icon={ClipboardCheck}
          variant="success"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Job Postings
          </TabsTrigger>
          <TabsTrigger value="applicants" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Applicants
            <Badge variant="secondary" className="ml-1">{inPipeline}</Badge>
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Onboarding
            <Badge variant="secondary" className="ml-1">{onboardingCount}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Job Postings Tab */}
        <TabsContent value="jobs" className="mt-6">
          <div className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search job postings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Job Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockJobPostings
                .filter(job => 
                  job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  job.department.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((job) => (
                  <JobPostingCard 
                    key={job.id} 
                    job={job}
                    onView={(j) => {
                      setSelectedJob(j.id);
                      setActiveTab('applicants');
                    }}
                    onEdit={(j) => console.log('Edit job', j.id)}
                  />
                ))}
            </div>
          </div>
        </TabsContent>

        {/* Applicants Tab */}
        <TabsContent value="applicants" className="mt-6">
          <div className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex-1">
                    <Select value={selectedJob} onValueChange={setSelectedJob}>
                      <SelectTrigger className="w-full sm:w-64">
                        <SelectValue placeholder="Filter by job" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="all">All Active Jobs</SelectItem>
                        {mockJobPostings
                          .filter(j => j.status === 'active')
                          .map((job) => (
                            <SelectItem key={job.id} value={job.id}>
                              {job.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredApplicants.length} applicants in pipeline
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Pipeline View */}
            <div className="overflow-x-auto pb-4">
              <ApplicantPipeline
                applicants={filteredApplicants}
                onSelectApplicant={handleSelectApplicant}
                onMoveApplicant={handleMoveApplicant}
              />
            </div>
          </div>
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="mt-6">
          <OnboardingChecklist onboardingProgress={mockOnboardingProgress} />
        </TabsContent>
      </Tabs>

      {/* Applicant Detail Sheet */}
      <ApplicantDetailSheet
        applicant={selectedApplicant}
        open={applicantSheetOpen}
        onOpenChange={setApplicantSheetOpen}
        onMoveStage={handleMoveApplicant}
      />

      {/* Create Job Dialog */}
      <CreateJobDialog
        open={createJobOpen}
        onOpenChange={setCreateJobOpen}
      />

      {/* Offer Letter Dialog */}
      <OfferLetterDialog
        applicant={selectedApplicant}
        open={offerLetterOpen}
        onOpenChange={setOfferLetterOpen}
      />
    </div>
  );
}
