import { useState } from 'react';
import { format } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  FileText, 
  MessageSquare, 
  Scale, 
  Gavel,
  History,
  User,
  Lock,
} from 'lucide-react';
import { useHRCaseDetail } from '@/hooks/useHRCases';
import { CaseOverviewTab } from './tabs/CaseOverviewTab';
import { CaseTriageTab } from './tabs/CaseTriageTab';
import { CaseNotesTab } from './tabs/CaseNotesTab';
import { CaseEvidenceTab } from './tabs/CaseEvidenceTab';
import { CaseFindingsTab } from './tabs/CaseFindingsTab';
import { CaseActionsTab } from './tabs/CaseActionsTab';
import { CaseAuditTab } from './tabs/CaseAuditTab';
import {
  CASE_TYPE_LABELS,
  CASE_SEVERITY_LABELS,
  CASE_STATUS_LABELS,
} from '@/types/hrCases';

interface CaseDetailSheetProps {
  caseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function CaseDetailSheet({ caseId, open, onOpenChange, onUpdate }: CaseDetailSheetProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  const {
    hrCase,
    triage,
    notes,
    evidence,
    findings,
    actions,
    auditLog,
    loading,
    createTriage,
    addNote,
    uploadEvidence,
    recordFindings,
    addAction,
    updateAction,
  } = useHRCaseDetail(open ? caseId : null);

  if (!hrCase) {
    return null;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-muted';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500 text-white';
      case 'triaged': return 'bg-purple-500 text-white';
      case 'investigating': return 'bg-amber-500 text-black';
      case 'awaiting_response': return 'bg-cyan-500 text-white';
      case 'decision_made': return 'bg-indigo-500 text-white';
      case 'closed': return 'bg-gray-500 text-white';
      default: return 'bg-muted';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl p-0 flex flex-col h-full">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg font-semibold">
                  {hrCase.case_number}
                </SheetTitle>
                {hrCase.confidentiality_level === 'restricted' && (
                  <Badge variant="outline" className="border-red-500 text-red-500">
                    <Lock className="h-3 w-3 mr-1" />
                    Restricted
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {hrCase.summary}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hrCase.safeguarding_flag && (
                <Badge className="bg-red-600 text-white">
                  <Shield className="h-3 w-3 mr-1" />
                  Safeguarding
                </Badge>
              )}
              <Badge className={getSeverityColor(hrCase.severity)}>
                {CASE_SEVERITY_LABELS[hrCase.severity]}
              </Badge>
              <Badge className={getStatusColor(hrCase.status)}>
                {CASE_STATUS_LABELS[hrCase.status]}
              </Badge>
            </div>
          </div>
          
          {hrCase.employee && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>
                {hrCase.employee.first_name} {hrCase.employee.last_name}
                {hrCase.employee.position && ` — ${hrCase.employee.position}`}
              </span>
            </div>
          )}
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="px-6 py-2 justify-start border-b rounded-none bg-transparent h-auto">
            <TabsTrigger value="overview" className="gap-1.5">
              <FileText className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="triage" className="gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              Triage
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-1.5">
              <MessageSquare className="h-4 w-4" />
              Notes
              {notes.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {notes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="evidence" className="gap-1.5">
              <FileText className="h-4 w-4" />
              Evidence
              {evidence.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {evidence.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="findings" className="gap-1.5">
              <Scale className="h-4 w-4" />
              Findings
            </TabsTrigger>
            <TabsTrigger value="actions" className="gap-1.5">
              <Gavel className="h-4 w-4" />
              Actions
              {actions.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {actions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5">
              <History className="h-4 w-4" />
              Audit
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <div className="p-6">
              <TabsContent value="overview" className="mt-0">
                <CaseOverviewTab hrCase={hrCase} />
              </TabsContent>
              
              <TabsContent value="triage" className="mt-0">
                <CaseTriageTab 
                  hrCase={hrCase}
                  triage={triage}
                  onCreateTriage={createTriage}
                />
              </TabsContent>
              
              <TabsContent value="notes" className="mt-0">
                <CaseNotesTab 
                  notes={notes}
                  onAddNote={addNote}
                />
              </TabsContent>
              
              <TabsContent value="evidence" className="mt-0">
                <CaseEvidenceTab 
                  evidence={evidence}
                  onUploadEvidence={uploadEvidence}
                />
              </TabsContent>
              
              <TabsContent value="findings" className="mt-0">
                <CaseFindingsTab 
                  hrCase={hrCase}
                  findings={findings}
                  onRecordFindings={recordFindings}
                />
              </TabsContent>
              
              <TabsContent value="actions" className="mt-0">
                <CaseActionsTab 
                  actions={actions}
                  onAddAction={addAction}
                  onUpdateAction={updateAction}
                />
              </TabsContent>
              
              <TabsContent value="audit" className="mt-0">
                <CaseAuditTab auditLog={auditLog} />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
