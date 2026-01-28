import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuditPacks } from '@/hooks/useAuditPacks';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';
import { 
  AUDIT_PACK_LABELS, 
  AUDIT_PACK_DESCRIPTIONS, 
  type AuditPackType 
} from '@/types/auditPacks';
import { 
  FileArchive, 
  CalendarIcon, 
  Users, 
  ShieldCheck, 
  AlertTriangle,
  FileText,
  Loader2,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AuditPackBuilder() {
  const [packType, setPackType] = useState<AuditPackType>('organisation_compliance');
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>();
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>();
  const [includeRestricted, setIncludeRestricted] = useState(false);
  const [includeAttachments, setIncludeAttachments] = useState(false);
  const [confirmedRestricted, setConfirmedRestricted] = useState(false);

  const { employees, isLoading: employeesLoading } = useSupabaseEmployees();
  const { 
    getPreview, 
    createAuditPack, 
    isCreating, 
    isPreviewing, 
    preview 
  } = useAuditPacks();

  const requiresEmployee = packType === 'employee_compliance';
  const supportsEmployee = ['employee_compliance', 'hr_incidents', 'payroll_verification'].includes(packType);

  // Reset employee when switching to non-employee pack
  useEffect(() => {
    if (!supportsEmployee) {
      setEmployeeId(null);
    }
  }, [packType, supportsEmployee]);

  // Fetch preview when parameters change
  useEffect(() => {
    if (requiresEmployee && !employeeId) return;
    
    const timeout = setTimeout(() => {
      getPreview({
        packType,
        employeeId: supportsEmployee ? employeeId : null,
        dateRangeStart: dateRangeStart ? format(dateRangeStart, 'yyyy-MM-dd') : null,
        dateRangeEnd: dateRangeEnd ? format(dateRangeEnd, 'yyyy-MM-dd') : null,
      }).catch(console.error);
    }, 500);

    return () => clearTimeout(timeout);
  }, [packType, employeeId, dateRangeStart, dateRangeEnd, requiresEmployee, supportsEmployee, getPreview]);

  const handleGenerate = async () => {
    if (requiresEmployee && !employeeId) return;
    if (includeRestricted && !confirmedRestricted) return;

    await createAuditPack({
      pack_type: packType,
      employee_id: supportsEmployee ? employeeId : null,
      date_range_start: dateRangeStart ? format(dateRangeStart, 'yyyy-MM-dd') : null,
      date_range_end: dateRangeEnd ? format(dateRangeEnd, 'yyyy-MM-dd') : null,
      include_restricted_content: includeRestricted,
      include_attachments: includeAttachments,
    });
  };

  const canGenerate = 
    (!requiresEmployee || employeeId) && 
    (!includeRestricted || confirmedRestricted) &&
    !isCreating;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Configuration Panel */}
      <div className="lg:col-span-2 space-y-6">
        {/* Pack Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileArchive className="h-5 w-5" />
              Select Audit Pack Type
            </CardTitle>
            <CardDescription>
              Choose the type of audit pack to generate
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {(Object.keys(AUDIT_PACK_LABELS) as AuditPackType[]).map((type) => (
              <button
                key={type}
                onClick={() => setPackType(type)}
                className={cn(
                  'p-4 rounded-lg border text-left transition-all',
                  packType === type
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
              >
                <div className="font-medium">{AUDIT_PACK_LABELS[type]}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {AUDIT_PACK_DESCRIPTIONS[type]}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Scope Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Define Scope
            </CardTitle>
            <CardDescription>
              Set the employee and date range for the audit pack
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Employee Selection */}
            {supportsEmployee && (
              <div className="space-y-2">
                <Label>
                  Employee {requiresEmployee && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={employeeId || 'all'}
                  onValueChange={(v) => setEmployeeId(v === 'all' ? null : v)}
                  disabled={employeesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {!requiresEmployee && (
                      <SelectItem value="all">All Employees</SelectItem>
                    )}
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Range */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dateRangeStart && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRangeStart ? format(dateRangeStart, 'PPP') : 'All time'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRangeStart}
                      onSelect={setDateRangeStart}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dateRangeEnd && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRangeEnd ? format(dateRangeEnd, 'PPP') : 'All time'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRangeEnd}
                      onSelect={setDateRangeEnd}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Options
            </CardTitle>
            <CardDescription>
              Configure what to include in the audit pack
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Include Attachments</Label>
                <div className="text-sm text-muted-foreground">
                  Include uploaded documents and evidence files
                </div>
              </div>
              <Switch
                checked={includeAttachments}
                onCheckedChange={setIncludeAttachments}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  Include Restricted Content
                  <Badge variant="destructive" className="text-xs">Sensitive</Badge>
                </Label>
                <div className="text-sm text-muted-foreground">
                  Include confidential HR notes and restricted evidence
                </div>
              </div>
              <Switch
                checked={includeRestricted}
                onCheckedChange={(checked) => {
                  setIncludeRestricted(checked);
                  if (!checked) setConfirmedRestricted(false);
                }}
              />
            </div>

            {includeRestricted && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <p>
                    Restricted content may contain sensitive personal information 
                    and confidential investigation details.
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch
                      checked={confirmedRestricted}
                      onCheckedChange={setConfirmedRestricted}
                    />
                    <span className="text-sm">
                      I confirm I have authority to access restricted content
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pack Preview
            </CardTitle>
            <CardDescription>
              Estimated contents of the audit pack
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPreviewing ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : preview ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pack Type</span>
                    <span className="font-medium">{AUDIT_PACK_LABELS[preview.pack_type]}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Scope</span>
                    <span className="font-medium">{preview.scope}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date Range</span>
                    <span className="font-medium">{preview.dateRange}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="text-sm font-medium">Estimated Records</div>
                  {Object.entries(preview.estimatedRecords).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <Badge variant="secondary">{value}</Badge>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {requiresEmployee && !employeeId
                    ? 'Select an employee to see preview'
                    : 'Loading preview...'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Button 
          className="w-full" 
          size="lg"
          onClick={handleGenerate}
          disabled={!canGenerate}
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileArchive className="mr-2 h-4 w-4" />
              Generate Audit Pack
            </>
          )}
        </Button>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Audit packs are retained for 90 days and all generation 
            actions are logged for compliance purposes.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
