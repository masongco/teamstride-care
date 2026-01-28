import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, User } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_name?: string;
  user_email?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  created_at: string;
}

interface CaseAuditTabProps {
  auditLog: unknown[];
}

export function CaseAuditTab({ auditLog }: CaseAuditTabProps) {
  const logs = auditLog as AuditLogEntry[];

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No audit history available</p>
        </CardContent>
      </Card>
    );
  }

  const formatAction = (action: string) => {
    const parts = action.split('.');
    if (parts.length === 2) {
      return `${parts[0].charAt(0).toUpperCase() + parts[0].slice(1)} ${parts[1].replace(/_/g, ' ')}`;
    }
    return action.replace(/_/g, ' ');
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium flex items-center gap-2">
        <History className="h-4 w-4" />
        Audit Trail
      </h3>

      <div className="space-y-2">
        {logs.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">
                      {formatAction(entry.action)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(entry.created_at), 'dd MMM yyyy HH:mm:ss')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{entry.user_name || entry.user_email || 'System'}</span>
                  </div>
                  {entry.new_values && Object.keys(entry.new_values).length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <details>
                        <summary className="cursor-pointer hover:text-foreground">
                          View details
                        </summary>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {JSON.stringify(entry.new_values, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
