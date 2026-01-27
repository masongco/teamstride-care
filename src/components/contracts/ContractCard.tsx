import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Eye, Pen } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Contract, ContractStatus } from '@/types/contracts';
import { format } from 'date-fns';

interface ContractCardProps {
  contract: Contract;
  onView: (contract: Contract) => void;
  onSign: (contract: Contract) => void;
}

const statusConfig: Record<ContractStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }> = {
  draft: { label: 'Draft', variant: 'secondary', icon: FileText },
  pending_signature: { label: 'Pending Signature', variant: 'default', icon: Clock },
  signed: { label: 'Signed', variant: 'outline', icon: CheckCircle },
  expired: { label: 'Expired', variant: 'destructive', icon: AlertCircle },
  voided: { label: 'Voided', variant: 'destructive', icon: XCircle },
};

export function ContractCard({ contract, onView, onSign }: ContractCardProps) {
  const config = statusConfig[contract.status];
  const StatusIcon = config.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{contract.title}</h3>
              <p className="text-xs text-muted-foreground">{contract.position}</p>
            </div>
          </div>
          <Badge variant={config.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Employee</p>
            <p className="font-medium">{contract.employee_name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium truncate">{contract.employee_email}</p>
          </div>
          {contract.start_date && (
            <div>
              <p className="text-muted-foreground">Start Date</p>
              <p className="font-medium">{format(new Date(contract.start_date), 'MMM d, yyyy')}</p>
            </div>
          )}
          {contract.pay_rate && (
            <div>
              <p className="text-muted-foreground">Pay Rate</p>
              <p className="font-medium">${contract.pay_rate}/hr</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onView(contract)}>
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          {contract.status === 'pending_signature' && (
            <Button size="sm" className="flex-1 gradient-primary" onClick={() => onSign(contract)}>
              <Pen className="h-4 w-4 mr-1" />
              Sign
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Created {format(new Date(contract.created_at), 'MMM d, yyyy')}
          {contract.signed_at && (
            <> • Signed {format(new Date(contract.signed_at), 'MMM d, yyyy')}</>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
