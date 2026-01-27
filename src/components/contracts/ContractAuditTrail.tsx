import { History, FileText, Pen, Eye, Send, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ContractAuditLog } from '@/types/contracts';
import { format } from 'date-fns';

interface ContractAuditTrailProps {
  auditLogs: ContractAuditLog[];
}

const actionIcons: Record<string, typeof FileText> = {
  created: FileText,
  viewed: Eye,
  sent: Send,
  signed: Pen,
  approved: CheckCircle,
  rejected: XCircle,
  voided: XCircle,
};

const actionColors: Record<string, string> = {
  created: 'text-blue-500 bg-blue-500/10',
  viewed: 'text-gray-500 bg-gray-500/10',
  sent: 'text-purple-500 bg-purple-500/10',
  signed: 'text-green-500 bg-green-500/10',
  approved: 'text-green-500 bg-green-500/10',
  rejected: 'text-red-500 bg-red-500/10',
  voided: 'text-red-500 bg-red-500/10',
};

export function ContractAuditTrail({ auditLogs }: ContractAuditTrailProps) {
  if (auditLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No audit entries yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Audit Trail
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-4">
            {auditLogs.map((log, index) => {
              const Icon = actionIcons[log.action] || FileText;
              const colorClass = actionColors[log.action] || 'text-gray-500 bg-gray-500/10';

              return (
                <div key={log.id} className="flex gap-3">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div className={`p-2 rounded-full ${colorClass}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    {index < auditLogs.length - 1 && (
                      <div className="w-px h-full bg-border mt-2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium capitalize">{log.action}</p>
                      <time className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                      </time>
                    </div>
                    {log.actor_name && (
                      <p className="text-sm text-muted-foreground">
                        by {log.actor_name}
                      </p>
                    )}
                    {log.actor_email && !log.actor_name && (
                      <p className="text-sm text-muted-foreground">
                        by {log.actor_email}
                      </p>
                    )}
                    {log.ip_address && (
                      <p className="text-xs text-muted-foreground mt-1">
                        IP: {log.ip_address}
                      </p>
                    )}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-2 p-2 rounded bg-muted/50 text-xs">
                        {Object.entries(log.details).map(([key, value]) => (
                          <p key={key}>
                            <span className="text-muted-foreground">{key}:</span>{' '}
                            {String(value)}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
