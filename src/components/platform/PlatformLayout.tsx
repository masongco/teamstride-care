import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Building2,
  CreditCard,
  Users,
  FileText,
  Settings,
  Shield,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PlatformLayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: 'Organisations', icon: Building2, href: '/platform/orgs' },
  { label: 'Plans', icon: CreditCard, href: '/platform/plans' },
  { label: 'Platform Users', icon: Users, href: '/platform/users' },
  { label: 'Audit Logs', icon: FileText, href: '/platform/audit' },
  { label: 'Settings', icon: Settings, href: '/platform/settings' },
];

export function PlatformLayout({ children }: PlatformLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'Logged out',
      description: 'You have been logged out of Platform Admin.',
    });
    navigate('/platform/login');
  };

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = location.pathname.startsWith(item.href);
    const Icon = item.icon;

    const linkContent = (
      <Link
        to={item.href}
        onClick={() => setMobileMenuOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Platform Admin Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
        <div className="flex items-center justify-center gap-2 text-amber-400 text-sm font-medium">
          <Shield className="h-4 w-4" />
          <span>Platform Admin Control Plane</span>
        </div>
      </div>

      {/* Sidebar - Hidden on mobile */}
      <aside
        className={cn(
          'fixed left-0 top-10 z-40 h-[calc(100vh-40px)] bg-slate-800 border-r border-slate-700 hidden md:flex flex-col transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center h-16 px-4 border-b border-slate-700', collapsed ? 'justify-center' : 'gap-3')}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-white text-sm">Social Plus</span>
              <span className="text-xs text-slate-400">Platform Admin</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-slate-700">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              'w-full text-slate-300 hover:text-white hover:bg-slate-700/50',
              collapsed ? 'justify-center px-0' : 'justify-start'
            )}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-3">Logout</span>}
          </Button>
        </div>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between h-14 px-4 bg-slate-800 border-b border-slate-700">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-300"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-semibold text-white">Platform Admin</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-slate-300"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-64 h-full bg-slate-800 border-r border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 h-16 px-4 border-b border-slate-700">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-semibold text-white">Platform Admin</span>
            </div>
            <nav className="px-3 py-4 space-y-1">
              {navItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={cn(
        'min-h-[calc(100vh-40px)] transition-all duration-300 pt-14 md:pt-0',
        collapsed ? 'md:ml-16' : 'md:ml-64'
      )}>
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
