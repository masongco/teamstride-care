import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import Dashboard from './Dashboard';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Shield, Clock, FileText } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // If user is logged in, show the dashboard
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return (
      <AppLayout>
        <Dashboard />
      </AppLayout>
    );
  }

  // If user is not logged in, show landing page
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">SocialPlus HR</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Log in
            </Button>
            <Button onClick={() => navigate('/auth')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Human Resource Management
          <br />
          <span className="text-primary">Made Simple</span>
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Streamline your HR operations with our comprehensive HRMS solution.
          Manage employees, track compliance, handle contracts, and more.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => navigate('/auth')}>
            Start Free Trial
          </Button>
          <Button size="lg" variant="outline">
            Learn More
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-2xl font-bold text-center mb-12">
          Everything you need to manage your workforce
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-2">Employee Management</h4>
            <p className="text-sm text-muted-foreground">
              Centralize employee data, track onboarding, and manage your entire workforce.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-2">Compliance Tracking</h4>
            <p className="text-sm text-muted-foreground">
              Stay compliant with automated document tracking and expiry alerts.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-2">Digital Contracts</h4>
            <p className="text-sm text-muted-foreground">
              Create, send, and sign employment contracts with e-signature support.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-2">Time & Attendance</h4>
            <p className="text-sm text-muted-foreground">
              Track hours, manage leave requests, and process payroll seamlessly.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-primary rounded-2xl p-12 text-center">
          <h3 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to get started?
          </h3>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join thousands of organizations already using SocialPlus HR to manage their workforce effectively.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/auth')}>
            Create Your Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2024 SocialPlus. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
