import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import DeactivatedStaff from "./pages/DeactivatedStaff";
import Compliance from "./pages/Compliance";
import Leave from "./pages/Leave";
import Recruitment from "./pages/Recruitment";
import Contracts from "./pages/Contracts";
import Documents from "./pages/Documents";
import Payroll from "./pages/Payroll";
import PayrollExport from "./pages/PayrollExport";
import Performance from "./pages/Performance";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import HRCases from "./pages/HRCases";
// Portal pages
import PortalDashboard from "./pages/portal/PortalDashboard";
import MyDocuments from "./pages/portal/MyDocuments";
import MyTraining from "./pages/portal/MyTraining";
import MyProfile from "./pages/portal/MyProfile";
import MyReviews from "./pages/portal/MyReviews";
import MyGoals from "./pages/portal/MyGoals";
// LMS Admin pages
import LMSAdmin from "./pages/lms/LMSAdmin";
import CourseBuilder from "./pages/lms/CourseBuilder";
import AssignmentManager from "./pages/lms/AssignmentManager";
// Platform Admin pages
import PlatformLogin from "./pages/platform/PlatformLogin";
import OrganisationsList from "./pages/platform/OrganisationsList";
import OrganisationDetail from "./pages/platform/OrganisationDetail";
import PlansList from "./pages/platform/PlansList";
import PlatformUsers from "./pages/platform/PlatformUsers";
import AuditLogs from "./pages/platform/AuditLogs";
import PlatformSettings from "./pages/platform/PlatformSettings";
import AuditExports from "./pages/AuditExports";

const queryClient = new QueryClient();

// Wrapper for pages that need the AppLayout and authentication
const ProtectedPageWithLayout = ({ children }: { children: React.ReactNode }) => (
  <AuthGuard>
    <AppLayout>{children}</AppLayout>
  </AuthGuard>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.MODE === "ghpages" ? "/teamstride-care" : "/"}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/employees"
            element={
              <ProtectedPageWithLayout>
                <Employees />
              </ProtectedPageWithLayout>
            }
          />
          <Route
            path="/employees/deactivated"
            element={
              <ProtectedPageWithLayout>
                <DeactivatedStaff />
              </ProtectedPageWithLayout>
            }
          />
          <Route
            path="/compliance"
            element={
              <ProtectedPageWithLayout>
                <Compliance />
              </ProtectedPageWithLayout>
            }
          />
          <Route
            path="/leave"
            element={
              <ProtectedPageWithLayout>
                <Leave />
              </ProtectedPageWithLayout>
            }
          />
          <Route
            path="/timesheets"
            element={
              <ProtectedPageWithLayout>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold">Timesheets</h1>
                  <p className="text-muted-foreground mt-2">Coming soon...</p>
                </div>
              </ProtectedPageWithLayout>
            }
          />
          <Route
            path="/recruitment"
            element={
              <ProtectedPageWithLayout>
                <Recruitment />
              </ProtectedPageWithLayout>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedPageWithLayout>
                <Documents />
              </ProtectedPageWithLayout>
            }
          />
          <Route
            path="/contracts"
            element={
              <ProtectedPageWithLayout>
                <Contracts />
              </ProtectedPageWithLayout>
            }
          />
          <Route
            path="/performance"
            element={
              <ProtectedPageWithLayout>
                <Performance />
              </ProtectedPageWithLayout>
            }
          />
          <Route
            path="/payroll"
            element={
              <ProtectedPageWithLayout>
                <Payroll />
              </ProtectedPageWithLayout>
            }
          />
          <Route
            path="/payroll-export"
            element={
              <ProtectedPageWithLayout>
                <PayrollExport />
              </ProtectedPageWithLayout>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedPageWithLayout>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold">Reports</h1>
                  <p className="text-muted-foreground mt-2">Coming soon...</p>
                </div>
              </ProtectedPageWithLayout>
            }
          />
          <Route
            path="/hr-cases"
            element={
              <ProtectedPageWithLayout>
                <HRCases />
              </ProtectedPageWithLayout>
            }
          />
          <Route
            path="/audit-exports"
            element={
              <ProtectedPageWithLayout>
                <AuditExports />
              </ProtectedPageWithLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedPageWithLayout>
                <Settings />
              </ProtectedPageWithLayout>
            }
          />
          <Route
            path="/help"
            element={
              <ProtectedPageWithLayout>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold">Help Center</h1>
                  <p className="text-muted-foreground mt-2">Coming soon...</p>
                </div>
              </ProtectedPageWithLayout>
            }
          />
          {/* Employee Portal Routes */}
          <Route
            path="/portal"
            element={
              <ProtectedPageWithLayout>
                <PortalDashboard />
              </ProtectedPageWithLayout>
            }
          />
          <Route
            path="/portal/documents"
            element={
              <ProtectedPageWithLayout>
                <MyDocuments />
              </ProtectedPageWithLayout>
            }
          />
          <Route
            path="/portal/training"
            element={
              <ProtectedPageWithLayout>
                <MyTraining />
              </ProtectedPageWithLayout>
            }
          />
          <Route
            path="/portal/profile"
            element={
              <ProtectedPageWithLayout>
                <MyProfile />
              </ProtectedPageWithLayout>
            }
          />
          <Route
            path="/portal/reviews"
            element={
              <ProtectedPageWithLayout>
                <MyReviews />
              </ProtectedPageWithLayout>
            }
          />
          <Route
            path="/portal/goals"
            element={
              <ProtectedPageWithLayout>
                <MyGoals />
              </ProtectedPageWithLayout>
            }
          />
          <Route
            path="/lms"
            element={
              <ProtectedPageWithLayout>
                <LMSAdmin />
              </ProtectedPageWithLayout>
            }
          />
          <Route
            path="/lms/course/:courseId"
            element={
              <ProtectedPageWithLayout>
                <CourseBuilder />
              </ProtectedPageWithLayout>
            }
          />
          <Route
            path="/lms/assignments"
            element={
              <ProtectedPageWithLayout>
                <AssignmentManager />
              </ProtectedPageWithLayout>
            }
          />
          {/* Platform Admin Routes */}
          <Route path="/platform/login" element={<PlatformLogin />} />
          <Route path="/platform/orgs" element={<OrganisationsList />} />
          <Route path="/platform/orgs/:id" element={<OrganisationDetail />} />
          <Route path="/platform/plans" element={<PlansList />} />
          <Route path="/platform/users" element={<PlatformUsers />} />
          <Route path="/platform/audit" element={<AuditLogs />} />
          <Route path="/platform/settings" element={<PlatformSettings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
