/**
 * Hook for managing audit packs
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { auditPackService } from '@/services/auditPackService';
import { toast } from '@/hooks/use-toast';
import type { AuditPackType, CreateAuditPackInput, AuditPack } from '@/types/auditPacks';

export function useAuditPacks(organisationId?: string) {
  const queryClient = useQueryClient();

  // Get default organisation if not provided
  const { data: defaultOrg } = useQuery({
    queryKey: ['default-organisation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organisations')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !organisationId,
  });

  const orgId = organisationId || defaultOrg?.id;

  // Fetch all audit packs
  const {
    data: auditPacks = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['audit-packs', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      return auditPackService.getAuditPacks(orgId);
    },
    enabled: !!orgId,
    refetchInterval: 10000, // Poll for status updates
  });

  // Get preview mutation
  const previewMutation = useMutation({
    mutationFn: async ({
      packType,
      employeeId,
      dateRangeStart,
      dateRangeEnd,
    }: {
      packType: AuditPackType;
      employeeId?: string | null;
      dateRangeStart?: string | null;
      dateRangeEnd?: string | null;
    }) => {
      if (!orgId) throw new Error('Organisation not found');
      return auditPackService.getPreview(
        packType,
        orgId,
        employeeId,
        dateRangeStart,
        dateRangeEnd
      );
    },
  });

  // Create audit pack mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateAuditPackInput) => {
      if (!orgId) throw new Error('Organisation not found');
      const pack = await auditPackService.createAuditPack(orgId, input);
      // Trigger generation
      await auditPackService.generatePack(pack.id);
      return pack;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-packs', orgId] });
      toast({
        title: 'Audit Pack Requested',
        description: 'Your audit pack is being generated. This may take a few moments.',
      });
    },
    onError: (error) => {
      console.error('[useAuditPacks] Create failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to create audit pack. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Get download URL mutation
  const downloadMutation = useMutation({
    mutationFn: async (filePath: string) => {
      return auditPackService.getDownloadUrl(filePath);
    },
    onError: (error) => {
      console.error('[useAuditPacks] Download failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to get download link. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Filter helpers
  const completedPacks = auditPacks.filter((p) => p.status === 'completed');
  const pendingPacks = auditPacks.filter(
    (p) => p.status === 'pending' || p.status === 'generating'
  );
  const failedPacks = auditPacks.filter((p) => p.status === 'failed');

  return {
    // Data
    auditPacks,
    completedPacks,
    pendingPacks,
    failedPacks,
    organisationId: orgId,

    // Status
    isLoading,
    error,

    // Actions
    getPreview: previewMutation.mutateAsync,
    createAuditPack: createMutation.mutateAsync,
    getDownloadUrl: downloadMutation.mutateAsync,
    refetch,

    // Mutation states
    isCreating: createMutation.isPending,
    isPreviewing: previewMutation.isPending,
    isDownloading: downloadMutation.isPending,
    preview: previewMutation.data,
  };
}

export function useAuditPack(packId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-pack', packId],
    queryFn: async () => {
      return auditPackService.getAuditPack(packId);
    },
    enabled: !!packId,
    refetchInterval: (query) => {
      const pack = query.state.data as AuditPack | null;
      // Poll while generating
      if (pack?.status === 'pending' || pack?.status === 'generating') {
        return 5000;
      }
      return false;
    },
  });

  return {
    auditPack: data,
    isLoading,
    error,
  };
}
