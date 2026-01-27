import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Compliance from "./pages/Compliance";
import Leave from "./pages/Leave";
import Recruitment from "./pages/Recruitment";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper for pages that need the AppLayout
const PageWithLayout = ({ children }: { children: React.ReactNode }) => (
  <AppLayout>{children}</AppLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/employees"
            element={
              <PageWithLayout>
                <Employees />
              </PageWithLayout>
            }
          />
          <Route
            path="/compliance"
            element={
              <PageWithLayout>
                <Compliance />
              </PageWithLayout>
            }
          />
          <Route
            path="/leave"
            element={
              <PageWithLayout>
                <Leave />
              </PageWithLayout>
            }
          />
          <Route
            path="/timesheets"
            element={
              <PageWithLayout>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold">Timesheets</h1>
                  <p className="text-muted-foreground mt-2">Coming soon...</p>
                </div>
              </PageWithLayout>
            }
          />
          <Route
            path="/recruitment"
            element={
              <PageWithLayout>
                <Recruitment />
              </PageWithLayout>
            }
          />
          <Route
            path="/documents"
            element={
              <PageWithLayout>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold">Documents</h1>
                  <p className="text-muted-foreground mt-2">Coming soon...</p>
                </div>
              </PageWithLayout>
            }
          />
          <Route
            path="/performance"
            element={
              <PageWithLayout>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold">Performance</h1>
                  <p className="text-muted-foreground mt-2">Coming soon...</p>
                </div>
              </PageWithLayout>
            }
          />
          <Route
            path="/payroll"
            element={
              <PageWithLayout>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold">Payroll</h1>
                  <p className="text-muted-foreground mt-2">Coming soon...</p>
                </div>
              </PageWithLayout>
            }
          />
          <Route
            path="/reports"
            element={
              <PageWithLayout>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold">Reports</h1>
                  <p className="text-muted-foreground mt-2">Coming soon...</p>
                </div>
              </PageWithLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <PageWithLayout>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold">Settings</h1>
                  <p className="text-muted-foreground mt-2">Coming soon...</p>
                </div>
              </PageWithLayout>
            }
          />
          <Route
            path="/help"
            element={
              <PageWithLayout>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold">Help Center</h1>
                  <p className="text-muted-foreground mt-2">Coming soon...</p>
                </div>
              </PageWithLayout>
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
