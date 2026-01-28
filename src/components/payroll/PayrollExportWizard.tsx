import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  FileSpreadsheet,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Download,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import type {
  PayPeriod,
  PayrollProvider,
  ExportValidationResult,
  TimesheetForExport,
} from '@/types/payroll';
import { PROVIDER_LABELS, PROVIDER_DESCRIPTIONS } from '@/types/payroll';

interface PayrollExportWizardProps {
  selectedPayPeriod: PayPeriod | null;
  validationResult: ExportValidationResult | null;
  isValidating: boolean;
  isGenerating: boolean;
  onValidate: (payPeriodId: string) => Promise<ExportValidationResult>;
  onGenerate: (payPeriodId: string, provider: PayrollProvider, timesheets: TimesheetForExport[]) => Promise<void>;
  onDownload: (filePath: string) => Promise<string>;
}

type WizardStep = 'provider' | 'validation' | 'confirm' | 'complete';

export function PayrollExportWizard({
  selectedPayPeriod,
  validationResult,
  isValidating,
  isGenerating,
  onValidate,
  onGenerate,
  onDownload,
}: PayrollExportWizardProps) {
  const [step, setStep] = useState<WizardStep>('provider');
  const [selectedProvider, setSelectedProvider] = useState<PayrollProvider>('generic_csv');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [exportedFilePath, setExportedFilePath] = useState<string | null>(null);

  const handleValidate = async () => {
    if (!selectedPayPeriod) return;
    await onValidate(selectedPayPeriod.id);
    setStep('validation');
  };

  const handleGenerate = async () => {
    if (!selectedPayPeriod || !validationResult) return;
    await onGenerate(selectedPayPeriod.id, selectedProvider, validationResult.timesheets);
    setStep('complete');
  };

  const handleDownload = async (filePath: string) => {
    const url = await onDownload(filePath);
    setDownloadUrl(url);
    window.open(url, '_blank');
  };

  const renderProviderStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Select Export Format</h3>
        <p className="text-sm text-muted-foreground">
          Choose the payroll system you're exporting to
        </p>
      </div>

      <RadioGroup
        value={selectedProvider}
        onValueChange={(value) => setSelectedProvider(value as PayrollProvider)}
        className="space-y-3"
      >
        {(Object.keys(PROVIDER_LABELS) as PayrollProvider[]).map((provider) => (
          <div
            key={provider}
            className={`flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
              selectedProvider === provider
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-muted/50'
            }`}
            onClick={() => setSelectedProvider(provider)}
          >
            <RadioGroupItem value={provider} id={provider} className="mt-1" />
            <div className="flex-1">
              <Label htmlFor={provider} className="font-medium cursor-pointer">
                {PROVIDER_LABELS[provider]}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {PROVIDER_DESCRIPTIONS[provider]}
              </p>
            </div>
          </div>
        ))}
      </RadioGroup>

      <div className="flex justify-end">
        <Button onClick={handleValidate} disabled={isValidating}>
          {isValidating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Validate & Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderValidationStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium mb-2">Validation Results</h3>
          <p className="text-sm text-muted-foreground">
            Review any issues before generating the export
          </p>
        </div>
        {validationResult && (
          <Badge
            variant={validationResult.isValid ? 'outline' : 'destructive'}
            className={validationResult.isValid ? 'bg-green-50 text-green-700 border-green-200' : ''}
          >
            {validationResult.isValid ? 'Valid' : 'Has Errors'}
          </Badge>
        )}
      </div>

      {validationResult?.errors && validationResult.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Errors ({validationResult.errors.length})</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {validationResult.errors.slice(0, 5).map((error, i) => (
                <li key={i} className="text-sm">{error.message}</li>
              ))}
              {validationResult.errors.length > 5 && (
                <li className="text-sm">...and {validationResult.errors.length - 5} more</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validationResult?.warnings && validationResult.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warnings ({validationResult.warnings.length})</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {validationResult.warnings.slice(0, 5).map((warning, i) => (
                <li key={i} className="text-sm">{warning.message}</li>
              ))}
              {validationResult.warnings.length > 5 && (
                <li className="text-sm">...and {validationResult.warnings.length - 5} more</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validationResult?.timesheets && validationResult.timesheets.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">
            Timesheets to Export ({validationResult.timesheets.length})
          </h4>
          <div className="border rounded-lg max-h-64 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validationResult.timesheets.slice(0, 10).map((ts) => (
                  <TableRow key={ts.id}>
                    <TableCell className="font-medium">{ts.employee_name}</TableCell>
                    <TableCell>{format(new Date(ts.date), 'dd MMM yyyy')}</TableCell>
                    <TableCell>{ts.total_hours?.toFixed(2) || '-'}</TableCell>
                  </TableRow>
                ))}
                {validationResult.timesheets.length > 10 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      ...and {validationResult.timesheets.length - 10} more timesheets
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('provider')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={() => setStep('confirm')}
          disabled={!validationResult?.isValid || validationResult.timesheets.length === 0}
        >
          Continue to Export
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Confirm Export</h3>
        <p className="text-sm text-muted-foreground">
          Review the export details before generating
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Format</span>
          <span className="font-medium">{PROVIDER_LABELS[selectedProvider]}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pay Period</span>
          <span className="font-medium">
            {selectedPayPeriod &&
              `${format(new Date(selectedPayPeriod.start_date), 'dd MMM')} - ${format(new Date(selectedPayPeriod.end_date), 'dd MMM yyyy')}`}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Timesheets</span>
          <span className="font-medium">{validationResult?.timesheets.length || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Hours</span>
          <span className="font-medium">
            {validationResult?.timesheets
              .reduce((sum, t) => sum + (t.total_hours || 0), 0)
              .toFixed(2) || '0'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Employees</span>
          <span className="font-medium">
            {new Set(validationResult?.timesheets.map(t => t.employee_id)).size || 0}
          </span>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          Exporting will lock these timesheets from further editing. Make sure all entries are correct before proceeding.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('validation')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Generate Export
          <FileSpreadsheet className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center py-8">
      <div className="flex justify-center">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-medium mb-2">Export Complete!</h3>
        <p className="text-sm text-muted-foreground">
          Your payroll export has been generated and timesheets have been locked.
        </p>
      </div>

      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => {
            setStep('provider');
            setDownloadUrl(null);
          }}
        >
          Create Another Export
        </Button>
      </div>
    </div>
  );

  if (!selectedPayPeriod) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Export Wizard
          </CardTitle>
          <CardDescription>
            Select a pay period to begin the export process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pay period selected</p>
            <p className="text-sm">Select an open pay period from the list above</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Export Wizard
        </CardTitle>
        <CardDescription>
          Exporting for: {format(new Date(selectedPayPeriod.start_date), 'dd MMM')} -{' '}
          {format(new Date(selectedPayPeriod.end_date), 'dd MMM yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['provider', 'validation', 'confirm', 'complete'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : ['provider', 'validation', 'confirm', 'complete'].indexOf(step) > i
                    ? 'bg-green-100 text-green-700'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
              {i < 3 && <div className="w-8 h-0.5 bg-muted mx-1" />}
            </div>
          ))}
        </div>

        {step === 'provider' && renderProviderStep()}
        {step === 'validation' && renderValidationStep()}
        {step === 'confirm' && renderConfirmStep()}
        {step === 'complete' && renderCompleteStep()}
      </CardContent>
    </Card>
  );
}
