import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Calculator, RotateCcw, Info } from 'lucide-react';
import { usePayrollCalculator } from '@/hooks/usePayrollCalculator';
import { ShiftEntryForm } from '@/components/payroll/ShiftEntryForm';
import { ShiftsList } from '@/components/payroll/ShiftsList';
import { PayrollSummaryCard } from '@/components/payroll/PayrollSummaryCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AwardClassification } from '@/hooks/useSettings';

export default function Payroll() {
  const {
    awardClassifications,
    selectedAward,
    setSelectedAward,
    shifts,
    addShift,
    removeShift,
    clearShifts,
    calculations,
    summary,
    loading,
  } = usePayrollCalculator();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  const handleAwardChange = (awardId: string) => {
    const award = awardClassifications.find(a => a.id === awardId);
    if (award) {
      setSelectedAward(award);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (awardClassifications.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Payroll Calculator</h1>
          <p className="text-muted-foreground">
            Calculate employee wages based on award classifications and shift times
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No Award Classifications</AlertTitle>
          <AlertDescription>
            You need to create at least one award classification before using the payroll calculator. 
            Go to Settings → Award Classifications to add pay rates and penalty multipliers.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payroll Calculator</h1>
          <p className="text-muted-foreground">
            Calculate employee wages based on award classifications and shift times
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">{shifts.length} shifts</span>
        </div>
      </div>

      {/* Award Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Award Classification</CardTitle>
          <CardDescription>
            Select the award classification to use for pay calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="space-y-2 flex-1 max-w-md">
              <Label>Select Award</Label>
              <Select
                value={selectedAward?.id || ''}
                onValueChange={handleAwardChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an award classification" />
                </SelectTrigger>
                <SelectContent>
                  {awardClassifications.map((award) => (
                    <SelectItem key={award.id} value={award.id}>
                      {award.name} - {formatCurrency(award.base_hourly_rate)}/hr
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAward && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md flex-1">
                <p className="font-medium text-foreground mb-1">Penalty Rates:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                  <span>Saturday: {selectedAward.saturday_multiplier}x</span>
                  <span>Sunday: {selectedAward.sunday_multiplier}x</span>
                  <span>Public Holiday: {selectedAward.public_holiday_multiplier}x</span>
                  <span>Evening: {selectedAward.evening_multiplier}x</span>
                  <span>Night: {selectedAward.night_multiplier}x</span>
                  <span>Overtime: {selectedAward.overtime_multiplier}x</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Shift Entry */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg">Add Shifts</CardTitle>
            <CardDescription>
              Enter shift details to calculate pay. Evening: 6pm-11pm, Night: 11pm-6am
            </CardDescription>
          </div>
          {shifts.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearShifts}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <ShiftEntryForm onAddShift={addShift} />
        </CardContent>
      </Card>

      {/* Shifts List */}
      {shifts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shifts</CardTitle>
            <CardDescription>
              All entered shifts with calculated pay
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ShiftsList
              shifts={shifts}
              calculations={calculations}
              onRemoveShift={removeShift}
              formatCurrency={formatCurrency}
            />
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {shifts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Pay Summary</h2>
          <PayrollSummaryCard
            summary={summary}
            selectedAward={selectedAward}
            formatCurrency={formatCurrency}
          />
        </div>
      )}
    </div>
  );
}
