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
import Payroll from "./pages/Payroll";
import Performance from "./pages/Performance";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

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
      <BrowserRouter>
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
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold">Documents</h1>
                  <p className="text-muted-foreground mt-2">Coming soon...</p>
                </div>
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
            path="/payroll"
            element={
              <ProtectedPageWithLayout>
                <Payroll />
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
