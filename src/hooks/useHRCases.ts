import { useState, useEffect, useCallback } from 'react';
import { hrCasesService } from '@/services/hrCasesService';
import { useToast } from '@/hooks/use-toast';
import type {
  HRCase,
  HRCaseTriage,
  HRCaseEvidence,
  HRCaseNote,
  HRCaseFindings,
  HRCaseAction,
  HRCaseStats,
  CreateHRCaseInput,
  UpdateHRCaseInput,
  CreateTriageInput,
  CreateNoteInput,
  CreateFindingsInput,
  CreateActionInput,
  UpdateActionInput,
  HRCaseStatus,
  HRCaseType,
  HRCaseSeverity,
} from '@/types/hrCases';

interface UseHRCasesFilters {
  status?: HRCaseStatus;
  case_type?: HRCaseType;
  severity?: HRCaseSeverity;
  assigned_investigator_user_id?: string;
  safeguarding_only?: boolean;
}

export function useHRCases(filters?: UseHRCasesFilters) {
  const [cases, setCases] = useState<HRCase[]>([]);
  const [stats, setStats] = useState<HRCaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const [casesData, statsData] = await Promise.all([
        hrCasesService.getCases(filters),
        hrCasesService.getStats(),
      ]);
      setCases(casesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching HR cases:', error);
      toast({
        title: 'Error',
        description: 'Failed to load HR cases',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const createCase = async (input: CreateHRCaseInput): Promise<HRCase | null> => {
    try {
      const newCase = await hrCasesService.createCase(input);
      toast({
        title: 'Case Created',
        description: `Case ${newCase.case_number} has been created`,
      });
      await fetchCases();
      return newCase;
    } catch (error) {
      console.error('Error creating case:', error);
      toast({
        title: 'Error',
        description: 'Failed to create case',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateCase = async (caseId: string, input: UpdateHRCaseInput): Promise<boolean> => {
    try {
      await hrCasesService.updateCase(caseId, input);
      toast({
        title: 'Case Updated',
        description: 'Case has been updated successfully',
      });
      await fetchCases();
      return true;
    } catch (error) {
      console.error('Error updating case:', error);
      toast({
        title: 'Error',
        description: 'Failed to update case',
        variant: 'destructive',
      });
      return false;
    }
  };

  const closeCase = async (caseId: string, closureNotes?: string): Promise<boolean> => {
    try {
      await hrCasesService.closeCase(caseId, closureNotes);
      toast({
        title: 'Case Closed',
        description: 'Case has been closed successfully',
      });
      await fetchCases();
      return true;
    } catch (error: unknown) {
      console.error('Error closing case:', error);
      const message = error instanceof Error ? error.message : 'Failed to close case';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    cases,
    stats,
    loading,
    refetch: fetchCases,
    createCase,
    updateCase,
    closeCase,
  };
}

export function useHRCaseDetail(caseId: string | null) {
  const [hrCase, setHRCase] = useState<HRCase | null>(null);
  const [triage, setTriage] = useState<HRCaseTriage | null>(null);
  const [notes, setNotes] = useState<HRCaseNote[]>([]);
  const [evidence, setEvidence] = useState<HRCaseEvidence[]>([]);
  const [findings, setFindings] = useState<HRCaseFindings | null>(null);
  const [actions, setActions] = useState<HRCaseAction[]>([]);
  const [auditLog, setAuditLog] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    if (!caseId) return;

    setLoading(true);
    try {
      const [
        caseData,
        triageData,
        notesData,
        evidenceData,
        findingsData,
        actionsData,
        auditData,
      ] = await Promise.all([
        hrCasesService.getCaseById(caseId),
        hrCasesService.getTriage(caseId),
        hrCasesService.getNotes(caseId),
        hrCasesService.getEvidence(caseId),
        hrCasesService.getFindings(caseId),
        hrCasesService.getActions(caseId),
        hrCasesService.getCaseAuditLog(caseId),
      ]);

      setHRCase(caseData);
      setTriage(triageData);
      setNotes(notesData);
      setEvidence(evidenceData);
      setFindings(findingsData);
      setActions(actionsData);
      setAuditLog(auditData);
    } catch (error) {
      console.error('Error fetching case detail:', error);
      toast({
        title: 'Error',
        description: 'Failed to load case details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [caseId, toast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createTriage = async (input: Omit<CreateTriageInput, 'hr_case_id'>): Promise<boolean> => {
    if (!caseId) return false;
    try {
      await hrCasesService.createTriage({ ...input, hr_case_id: caseId });
      toast({
        title: 'Triage Complete',
        description: 'Case has been triaged successfully',
      });
      await fetchAll();
      return true;
    } catch (error) {
      console.error('Error creating triage:', error);
      toast({
        title: 'Error',
        description: 'Failed to save triage',
        variant: 'destructive',
      });
      return false;
    }
  };

  const addNote = async (input: Omit<CreateNoteInput, 'hr_case_id'>): Promise<boolean> => {
    if (!caseId) return false;
    try {
      await hrCasesService.createNote({ ...input, hr_case_id: caseId });
      toast({
        title: 'Note Added',
        description: 'Note has been added to the case',
      });
      await fetchAll();
      return true;
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: 'Failed to add note',
        variant: 'destructive',
      });
      return false;
    }
  };

  const uploadEvidence = async (
    file: File,
    description?: string,
    accessLevel?: 'normal' | 'restricted'
  ): Promise<boolean> => {
    if (!caseId) return false;
    try {
      await hrCasesService.uploadEvidence(caseId, file, description, accessLevel);
      toast({
        title: 'Evidence Uploaded',
        description: 'Evidence has been uploaded successfully',
      });
      await fetchAll();
      return true;
    } catch (error) {
      console.error('Error uploading evidence:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload evidence',
        variant: 'destructive',
      });
      return false;
    }
  };

  const recordFindings = async (input: Omit<CreateFindingsInput, 'hr_case_id'>): Promise<boolean> => {
    if (!caseId) return false;
    try {
      await hrCasesService.createFindings({ ...input, hr_case_id: caseId });
      toast({
        title: 'Findings Recorded',
        description: 'Case findings have been recorded',
      });
      await fetchAll();
      return true;
    } catch (error) {
      console.error('Error recording findings:', error);
      toast({
        title: 'Error',
        description: 'Failed to record findings',
        variant: 'destructive',
      });
      return false;
    }
  };

  const addAction = async (input: Omit<CreateActionInput, 'hr_case_id'>): Promise<boolean> => {
    if (!caseId) return false;
    try {
      await hrCasesService.createAction({ ...input, hr_case_id: caseId });
      toast({
        title: 'Action Added',
        description: 'Disciplinary action has been recorded',
      });
      await fetchAll();
      return true;
    } catch (error) {
      console.error('Error adding action:', error);
      toast({
        title: 'Error',
        description: 'Failed to add action',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateAction = async (actionId: string, input: UpdateActionInput): Promise<boolean> => {
    try {
      await hrCasesService.updateAction(actionId, input);
      toast({
        title: 'Action Updated',
        description: 'Action has been updated',
      });
      await fetchAll();
      return true;
    } catch (error) {
      console.error('Error updating action:', error);
      toast({
        title: 'Error',
        description: 'Failed to update action',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    hrCase,
    triage,
    notes,
    evidence,
    findings,
    actions,
    auditLog,
    loading,
    refetch: fetchAll,
    createTriage,
    addNote,
    uploadEvidence,
    recordFindings,
    addAction,
    updateAction,
  };
}
