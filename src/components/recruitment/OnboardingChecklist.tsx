import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Onboarding is not wired to the database yet.
 * Keep this component compile-safe and UI-friendly until onboarding tables + RLS are added.
 */
export type OnboardingChecklistItem = {
  employeeId: string;
  employeeName: string;
  startDate?: string | null;
  completionPercentage?: number | null;
};

export function OnboardingChecklist({
  onboardingProgress,
}: {
  onboardingProgress: OnboardingChecklistItem[];
}) {
  const count = onboardingProgress?.length ?? 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Onboarding</CardTitle>
          <Badge variant="secondary">{count}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {count === 0 ? (
            <p className="text-sm text-muted-foreground">
              No onboarding data yet. This module will be enabled once onboarding tables are added and scoped by organisation_id.
            </p>
          ) : (
            <div className="space-y-2">
              {onboardingProgress.map((p) => (
                <div
                  key={p.employeeId}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.employeeName}</div>
                    {p.startDate ? (
                      <div className="text-xs text-muted-foreground truncate">Starts {p.startDate}</div>
                    ) : null}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {typeof p.completionPercentage === 'number' ? `${p.completionPercentage}%` : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2">
            <p className="text-xs text-muted-foreground">
              Note: The old checklist template + mock tasks were removed to keep recruitment backend-focused.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
