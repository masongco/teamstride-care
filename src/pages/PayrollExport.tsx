import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, FileSpreadsheet, Calendar, Link, History } from 'lucide-react';
import { usePayrollExport } from '@/hooks/usePayrollExport';
import { PayPeriodManager } from '@/components/payroll/PayPeriodManager';
import { PayrollMappingsManager } from '@/components/payroll/PayrollMappingsManager';
import { PayrollExportWizard } from '@/components/payroll/PayrollExportWizard';
import { PayrollExportHistory } from '@/components/payroll/PayrollExportHistory';
import type { PayPeriod } from '@/types/payroll';

export default function PayrollExport() {
  const [activeTab, setActiveTab] = useState('export');
  const [selectedPayPeriod, setSelectedPayPeriod] = useState<PayPeriod | null>(null);

  const {
    payPeriods,
    mappings,
    exports,
    isLoading,
    createPayPeriod,
    closePayPeriod,
    isCreatingPayPeriod,
    createMapping,
    updateMapping,
    deleteMapping,
    isCreatingMapping,
    validateExport,
    isValidating,
    validationResult,
    generateExport,
    isGenerating,
    voidExport,
    isVoiding,
    getDownloadUrl,
    isDownloading,
  } = usePayrollExport();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payroll Export</h1>
        <p className="text-muted-foreground mt-1">
          Generate payroll-ready CSV exports from approved timesheets
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export Wizard
          </TabsTrigger>
          <TabsTrigger value="periods" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Pay Periods
          </TabsTrigger>
          <TabsTrigger value="mappings" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Mappings
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-6">
          <PayPeriodManager
            payPeriods={payPeriods.filter(p => p.status === 'open')}
            onCreatePayPeriod={createPayPeriod}
            onClosePayPeriod={closePayPeriod}
            onSelectPayPeriod={setSelectedPayPeriod}
            selectedPayPeriodId={selectedPayPeriod?.id}
            isCreating={isCreatingPayPeriod}
          />

          <PayrollExportWizard
            selectedPayPeriod={selectedPayPeriod}
            validationResult={validationResult || null}
            isValidating={isValidating}
            isGenerating={isGenerating}
            onValidate={validateExport}
            onGenerate={async (payPeriodId, provider, timesheets) => {
              await generateExport({ payPeriodId, provider, timesheets });
              setSelectedPayPeriod(null);
            }}
            onDownload={getDownloadUrl}
          />
        </TabsContent>

        <TabsContent value="periods">
          <PayPeriodManager
            payPeriods={payPeriods}
            onCreatePayPeriod={createPayPeriod}
            onClosePayPeriod={closePayPeriod}
            onSelectPayPeriod={(p) => {
              if (p.status === 'open') {
                setSelectedPayPeriod(p);
                setActiveTab('export');
              }
            }}
            selectedPayPeriodId={selectedPayPeriod?.id}
            isCreating={isCreatingPayPeriod}
          />
        </TabsContent>

        <TabsContent value="mappings">
          <PayrollMappingsManager
            mappings={mappings}
            onCreateMapping={createMapping}
            onUpdateMapping={updateMapping}
            onDeleteMapping={deleteMapping}
            isCreating={isCreatingMapping}
          />
        </TabsContent>

        <TabsContent value="history">
          <PayrollExportHistory
            exports={exports}
            onDownload={getDownloadUrl}
            onVoid={voidExport}
            isVoiding={isVoiding}
            isDownloading={isDownloading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
