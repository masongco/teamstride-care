import { ReactNode } from 'react';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { Loader2 } from 'lucide-react';

interface PlatformGuardProps {
  children: ReactNode;
}

export function PlatformGuard({ children }: PlatformGuardProps) {
  const { loading, platformUser } = usePlatformAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-slate-400">Verifying platform access...</p>
        </div>
      </div>
    );
  }

  if (!platformUser) {
    return null;
  }

  return <>{children}</>;
}
