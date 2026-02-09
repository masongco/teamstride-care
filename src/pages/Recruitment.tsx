import { useEffect, useMemo, useState } from 'react';
import { Plus, Briefcase, Users, UserCheck, ClipboardCheck, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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

import { supabase } from '@/integrations/supabase/client';

// Avoid TypeScript "excessively deep" instantiation from generated Supabase types in this page.
// We keep the rest of the app strongly typed; this page uses a narrowed, runtime-safe surface.
const db = supabase as any;

type ApplicantStage =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected';

type JobStatus = 'draft' | 'active' | 'paused' | 'closed';

type JobPostingRow = {
  id: string;
  organisation_id: string;
  title: string;
  department: string | null;
  status: JobStatus;
  created_at: string;
  updated_at: string;
};

type ApplicantRow = {
  id: string;
  organisation_id: string;
  job_posting_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  stage: ApplicantStage;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export default function Recruitment() {
  const [activeTab, setActiveTab] = useState<'jobs' | 'applicants' | 'onboarding'>('jobs');
  const [selectedJob, setSelectedJob] = useState<string>('all');

  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantRow | null>(null);
  const [applicantSheetOpen, setApplicantSheetOpen] = useState(false);

  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [offerLetterOpen, setOfferLetterOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState<'all' | JobStatus>('all');

  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobPostingRow[]>([]);
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);

  // Onboarding is not connected yet — keep placeholder state.
  const [onboardingProgress, setOnboardingProgress] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    setOrganisationId(organisationId);
    return organisationId;
  };

  const loadRecruitmentData = async (orgId: string) => {
    const { data: jobsData, error: jobsErr } = await db
      .from('recruitment_job_postings')
      .select('id, organisation_id, title, department, status, created_at, updated_at')
      .eq('organisation_id', orgId)
      .order('created_at', { ascending: false });

    if (jobsErr) throw jobsErr;

    const { data: applicantsData, error: applicantsErr } = await db
      .from('recruitment_applicants')
      .select(
        'id, organisation_id, job_posting_id, first_name, last_name, email, phone, stage, source, notes, created_at, updated_at'
      )
      .eq('organisation_id', orgId)
      .order('created_at', { ascending: false });

    if (applicantsErr) throw applicantsErr;

    setJobs((jobsData ?? []) as any);
    setApplicants((applicantsData ?? []) as any);

    // Keep onboarding placeholder until backend table exists.
    setOnboardingProgress([]);
  };

  const refresh = async () => {
    setError(null);
    setLoading(true);
    try {
      const orgId = organisationId ?? (await loadOrganisationId());
      await loadRecruitmentData(orgId);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load recruitment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Metrics
  const activeJobs = useMemo(() => jobs.filter((j) => j.status === 'active').length, [jobs]);
  const totalApplicants = useMemo(() => applicants.length, [applicants]);
  const inPipeline = useMemo(
    () => applicants.filter((a) => !['hired', 'rejected'].includes(a.stage)).length,
    [applicants]
  );
  const onboardingCount = useMemo(() => onboardingProgress.length, [onboardingProgress]);

  // Job filtering
  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesQuery =
        !q ||
        job.title.toLowerCase().includes(q) ||
        (job.department ?? '').toLowerCase().includes(q);

      const matchesStatus = jobStatusFilter === 'all' ? true : job.status === jobStatusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [jobs, searchQuery, jobStatusFilter]);

  // Applicant filtering
  const filteredApplicants = useMemo(() => {
    const pipelineOnly = applicants.filter((a) => !['hired', 'rejected'].includes(a.stage));
    if (selectedJob === 'all') return pipelineOnly;
    return pipelineOnly.filter((a) => a.job_posting_id === selectedJob);
  }, [applicants, selectedJob]);

  const handleSelectApplicant = (applicant: ApplicantRow) => {
    setSelectedApplicant(applicant);
    setApplicantSheetOpen(true);
  };

  const handleMoveApplicant = async (applicant: ApplicantRow, newStage: ApplicantStage) => {
    setError(null);
    try {
      const { error: rpcErr } = await db.rpc('recruitment_move_applicant_stage', {
        p_applicant_id: applicant.id,
        p_to_stage: newStage,
        p_note: null,
      });

      if (rpcErr) throw rpcErr;

      await refresh();

      if (newStage === 'offer') {
        setSelectedApplicant(applicant);
        setOfferLetterOpen(true);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to move applicant stage');
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

      {error ? (
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-destructive">{error}</p>
              <div>
                <Button variant="outline" onClick={refresh}>
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Active Jobs" value={activeJobs} description="Open positions" icon={Briefcase} variant="default" />
        <MetricCard title="Total Applicants" value={totalApplicants} description="All time" icon={Users} variant="info" />
        <MetricCard title="In Pipeline" value={inPipeline} description="Currently reviewing" icon={UserCheck} variant="warning" />
        <MetricCard title="Onboarding" value={onboardingCount} description="New hires in progress" icon={ClipboardCheck} variant="success" />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
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
                  <Select value={jobStatusFilter} onValueChange={(v) => setJobStatusFilter(v as any)}>
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
              {loading ? (
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </CardContent>
                </Card>
              ) : filteredJobs.length === 0 ? (
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">No job postings found.</p>
                  </CardContent>
                </Card>
              ) : (
                filteredJobs.map((job) => (
                  <JobPostingCard
                    key={job.id}
                    job={job}
                    onView={(j) => {
                      setSelectedJob(j.id);
                      setActiveTab('applicants');
                    }}
                    onEdit={(j) => console.log('Edit job', j.id)}
                  />
                ))
              )}
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
                        {jobs
                          .filter((j) => j.status === 'active')
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

            <div className="overflow-x-auto pb-4">
              <ApplicantPipeline
                applicants={filteredApplicants as any}
                onSelectApplicant={handleSelectApplicant as any}
                onMoveApplicant={handleMoveApplicant as any}
              />
            </div>
          </div>
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="mt-6">
          <OnboardingChecklist onboardingProgress={onboardingProgress} />
        </TabsContent>
      </Tabs>

      <ApplicantDetailSheet
        applicant={selectedApplicant as any}
        open={applicantSheetOpen}
        onOpenChange={setApplicantSheetOpen}
        onMoveStage={handleMoveApplicant as any}
      />

      <CreateJobDialog
        open={createJobOpen}
        onOpenChange={(open) => {
          setCreateJobOpen(open);
          if (!open) void refresh();
        }}
      />

      <OfferLetterDialog
        applicant={selectedApplicant as any}
        open={offerLetterOpen}
        onOpenChange={(open) => {
          setOfferLetterOpen(open);
          if (!open) void refresh();
        }}
      />
    </div>
  );
}
