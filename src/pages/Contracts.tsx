import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, FileText, Search, FileSignature, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MetricCard } from '@/components/ui/metric-card';
import { ContractCard } from '@/components/contracts/ContractCard';
import { CreateContractDialog } from '@/components/contracts/CreateContractDialog';
import { ContractSigningDialog } from '@/components/contracts/ContractSigningDialog';
import { ContractViewSheet } from '@/components/contracts/ContractViewSheet';
import { useContracts } from '@/hooks/useContracts';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from '@/hooks/use-toast';
import { Contract, Signature, ContractAuditLog } from '@/types/contracts';

export default function Contracts() {
  const { contracts, isLoading, createContract, signContract, getSignature, getAuditLogs, logAuditEvent } = useContracts();
  const safeContracts = contracts ?? [];
  const { isAdmin, isManager } = useUserRole();
  const canManageContracts = !!(isAdmin || isManager);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [signingDialogOpen, setSigningDialogOpen] = useState(false);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedSignature, setSelectedSignature] = useState<Signature | null>(null);
  const [selectedAuditLogs, setSelectedAuditLogs] = useState<ContractAuditLog[]>([]);

  // Pre-flight organisation check (prevents RLS hard failure)
  const [hasOrg, setHasOrg] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const { data: userRes, error: userErr } = await supabase.auth.getUser();
        if (userErr || !userRes.user) {
          console.warn('Unable to resolve auth user for organisation check', userErr);
          if (isMounted) setHasOrg(false);
          return;
        }

        const { data: profile, error: profileErr } = (await supabase
          .from('profiles')
          // NOTE: `organisation_id` exists in the DB but your generated Supabase types
          // may be stale; cast the column selection to avoid TS errors.
          .select('organisation_id' as any)
          .eq('user_id', userRes.user.id)
          .maybeSingle()) as {
          data: { organisation_id: string | null } | null;
          error: any;
        };

        if (!isMounted) return;

        if (profileErr) {
          console.warn('Failed to load profile for organisation check', profileErr);
          setHasOrg(false);
          return;
        }

        setHasOrg(!!profile?.organisation_id);
      } catch (e) {
        console.warn('Unexpected error during organisation check', e);
        if (isMounted) setHasOrg(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate metrics
  const totalContracts = safeContracts.length;
  const pendingContracts = safeContracts.filter(c => c.status === 'pending_signature').length;
  const signedContracts = safeContracts.filter(c => c.status === 'signed').length;
  const expiredContracts = safeContracts.filter(c => c.status === 'expired').length;

  // Filter contracts
  const filteredContracts = safeContracts.filter((contract) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (contract.employee_name || '').toLowerCase().includes(q) ||
      (contract.position || '').toLowerCase().includes(q) ||
      (contract.title || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewContract = async (contract: Contract) => {
    setSelectedContract(contract);

    try {
      // Fetch signature and audit logs
      const [signature, logs] = await Promise.all([
        getSignature(contract.id),
        getAuditLogs(contract.id),
      ]);

      setSelectedSignature(signature);
      setSelectedAuditLogs(logs);

      // Log view event (best-effort)
      try {
        await logAuditEvent(contract.id, 'viewed');
      } catch (e) {
        // ignore audit logging failures
      }

      setViewSheetOpen(true);
    } catch (err: any) {
      console.error('Failed to load contract details:', err);
      toast({
        title: 'Error',
        description: 'Failed to load contract details. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSignContract = (contract: Contract) => {
    setSelectedContract(contract);
    setSigningDialogOpen(true);
  };

  const handleSign = async (
    contractId: string,
    signatureData: string,
    signatureType: 'drawn' | 'typed'
  ) => {
    if (!selectedContract) return;

    try {
      await signContract(
        contractId,
        signatureData,
        signatureType,
        selectedContract.employee_name,
        selectedContract.employee_email
      );
    } catch (err: any) {
      console.error('Failed to sign contract:', err);
      toast({
        title: 'Error',
        description: 'Failed to sign contract. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCreate = async (contract: Parameters<typeof createContract>[0]) => {
    if (!canManageContracts) {
      toast({
        title: 'Not allowed',
        description: 'You do not have permission to create contracts.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createContract(contract);
      toast({
        title: 'Contract created',
        description: 'The contract was created successfully.',
      });
      setCreateDialogOpen(false);
    } catch (err: any) {
      console.error('Failed to create contract:', err);
      toast({
        title: 'Create blocked',
        description: 'Failed to create contract. This may be blocked by permissions (RLS).',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Contracts & E-Signatures</h1>
          <p className="text-muted-foreground mt-1">
            Create, send, and manage employment contracts with digital signatures
          </p>
        </div>
        {canManageContracts && (
          <Button className="gradient-primary" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Contract
          </Button>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Contracts"
          value={totalContracts}
          description="All contracts"
          icon={FileText}
          variant="default"
        />
        <MetricCard
          title="Pending Signature"
          value={pendingContracts}
          description="Awaiting signature"
          icon={Clock}
          variant="warning"
        />
        <MetricCard
          title="Signed"
          value={signedContracts}
          description="Completed"
          icon={CheckCircle}
          variant="success"
        />
        <MetricCard
          title="Expired"
          value={expiredContracts}
          description="Need attention"
          icon={AlertCircle}
          variant="danger"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search contracts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_signature">Pending Signature</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="voided">Voided</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Grid */}
      {(isLoading || hasOrg === null) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6 h-48" />
            </Card>
          ))}
        </div>
      )}

      {!isLoading && hasOrg === false && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No organisation assigned</h3>
            <p className="text-sm text-muted-foreground">
              You must be assigned to an organisation before viewing contracts.
            </p>
          </CardContent>
        </Card>
      )}
      {hasOrg === true && (
        filteredContracts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileSignature className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No contracts found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first employment contract'}
              </p>
              {!searchQuery && statusFilter === 'all' && canManageContracts && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Contract
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContracts.map(contract => (
              <ContractCard
                key={contract.id}
                contract={contract}
                onView={handleViewContract}
                onSign={handleSignContract}
              />
            ))}
          </div>
        )
      )}

      {/* Dialogs */}
      <CreateContractDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreate}
      />

      <ContractSigningDialog
        contract={selectedContract}
        open={signingDialogOpen}
        onOpenChange={setSigningDialogOpen}
        onSign={handleSign}
      />

      <ContractViewSheet
        contract={selectedContract}
        signature={selectedSignature}
        auditLogs={selectedAuditLogs}
        open={viewSheetOpen}
        onOpenChange={setViewSheetOpen}
      />
    </div>
  );
}