import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  ClipboardList,
  DollarSign,
  HelpCircle,
  Target,
  GraduationCap,
  FolderOpen,
  User,
  Star,
  BookOpen,
  AlertTriangle,
  FileArchive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useSidebarSettings } from '@/hooks/useSidebarSettings';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  moduleKey: string;
  badge?: number;
}

// All available nav items with their module keys
const allNavItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/', moduleKey: 'dashboard' },
  { label: 'Employees', icon: Users, href: '/employees', moduleKey: 'employees' },
  { label: 'Compliance', icon: ShieldCheck, href: '/compliance', moduleKey: 'compliance', badge: 3 },
  { label: 'Recruitment', icon: UserPlus, href: '/recruitment', moduleKey: 'recruitment' },
  { label: 'Documents', icon: FileText, href: '/documents', moduleKey: 'documents' },
  { label: 'Contracts', icon: ClipboardList, href: '/contracts', moduleKey: 'contracts' },
  { label: 'Performance', icon: Target, href: '/performance', moduleKey: 'performance' },
  { label: 'HR Cases', icon: AlertTriangle, href: '/hr-cases', moduleKey: 'hr-cases' },
  { label: 'LMS Admin', icon: BookOpen, href: '/lms', moduleKey: 'lms' },
  { label: 'Payroll', icon: DollarSign, href: '/payroll', moduleKey: 'payroll' },
  { label: 'Audit & Exports', icon: FileArchive, href: '/audit-exports', moduleKey: 'audit-exports' },
  { label: 'Reports', icon: BarChart3, href: '/reports', moduleKey: 'reports' },
];

const portalNavItems: NavItem[] = [
  { label: 'My Portal', icon: LayoutDashboard, href: '/portal', moduleKey: 'portal' },
  { label: 'My Documents', icon: FolderOpen, href: '/portal/documents', moduleKey: 'portal-documents' },
  { label: 'My Training', icon: GraduationCap, href: '/portal/training', moduleKey: 'portal-training' },
  { label: 'My Reviews', icon: Star, href: '/portal/reviews', moduleKey: 'portal-reviews' },
  { label: 'My Goals', icon: Target, href: '/portal/goals', moduleKey: 'portal-goals' },
  { label: 'My Profile', icon: User, href: '/portal/profile', moduleKey: 'portal-profile' },
];

const bottomNavItems: NavItem[] = [
  { label: 'Settings', icon: Settings, href: '/settings', moduleKey: 'settings' },
  { label: 'Help', icon: HelpCircle, href: '/help', moduleKey: 'help' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { settings, loading, isModuleVisible } = useSidebarSettings();

  // Filter nav items based on visibility settings
  const visibleNavItems = allNavItems.filter(item => {
    // If settings haven't loaded yet, show all items
    if (loading || settings.length === 0) return true;
    return isModuleVisible(item.moduleKey);
  });

  // Sort by display order from settings
  const sortedNavItems = [...visibleNavItems].sort((a, b) => {
    const settingA = settings.find(s => s.module_key === a.moduleKey);
    const settingB = settings.find(s => s.module_key === b.moduleKey);
    return (settingA?.display_order ?? 99) - (settingB?.display_order ?? 99);
  });

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    const linkContent = (
      <Link
        to={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
        )}
      >
        <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-sidebar-primary')} />
        {!collapsed && (
          <>
            <span className="font-medium text-sm">{item.label}</span>
            {item.badge && (
              <span className="ml-auto bg-accent text-accent-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}
        {collapsed && item.badge && (
          <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full">
            {item.badge}
          </span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
            {item.badge && <span className="ml-2 text-accent">({item.badge})</span>}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-sidebar-border', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">S+</span>
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground text-sm">Social Plus</span>
            <span className="text-xs text-sidebar-foreground/60">Support Work</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {sortedNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
        
        {/* Portal Section */}
        {!collapsed && (
          <div className="pt-4 pb-2">
            <span className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
              Self-Service
            </span>
          </div>
        )}
        {collapsed && <Separator className="my-2" />}
        {portalNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        {bottomNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </div>

      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>
    </aside>
  );
}
