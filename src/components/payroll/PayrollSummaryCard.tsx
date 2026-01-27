import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PayrollSummary } from '@/hooks/usePayrollCalculator';
import { AwardClassification } from '@/hooks/useSettings';
import { Clock, DollarSign, TrendingUp } from 'lucide-react';

interface PayrollSummaryCardProps {
  summary: PayrollSummary;
  selectedAward: AwardClassification | null;
  formatCurrency: (amount: number) => string;
}

export function PayrollSummaryCard({ summary, selectedAward, formatCurrency }: PayrollSummaryCardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Hours Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalWorkedHours.toFixed(2)} hrs</div>
          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
            <p>Base: {summary.baseHours.toFixed(2)} hrs</p>
            <p>Penalty: {summary.penaltyHours.toFixed(2)} hrs</p>
          </div>
        </CardContent>
      </Card>

      {/* Base Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Base Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {selectedAward ? formatCurrency(selectedAward.base_hourly_rate) : '$0.00'}/hr
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedAward?.name || 'No award selected'}
          </p>
        </CardContent>
      </Card>

      {/* Gross Pay */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gross Pay</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{formatCurrency(summary.grossPay)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Before tax & deductions
          </p>
        </CardContent>
      </Card>

      {/* Pay Breakdown */}
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Pay Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Base Pay</span>
              <span className="font-medium">{formatCurrency(summary.basePay)}</span>
            </div>
            
            {summary.eveningPay > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  Evening Loading ({selectedAward?.evening_multiplier}x)
                </span>
                <span>{formatCurrency(summary.eveningPay)}</span>
              </div>
            )}
            
            {summary.nightPay > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  Night Loading ({selectedAward?.night_multiplier}x)
                </span>
                <span>{formatCurrency(summary.nightPay)}</span>
              </div>
            )}
            
            {summary.saturdayPay > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  Saturday Loading ({selectedAward?.saturday_multiplier}x)
                </span>
                <span>{formatCurrency(summary.saturdayPay)}</span>
              </div>
            )}
            
            {summary.sundayPay > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  Sunday Loading ({selectedAward?.sunday_multiplier}x)
                </span>
                <span>{formatCurrency(summary.sundayPay)}</span>
              </div>
            )}
            
            {summary.publicHolidayPay > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  Public Holiday ({selectedAward?.public_holiday_multiplier}x)
                </span>
                <span>{formatCurrency(summary.publicHolidayPay)}</span>
              </div>
            )}
            
            {summary.overtimePay > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  Overtime ({selectedAward?.overtime_multiplier}x)
                </span>
                <span>{formatCurrency(summary.overtimePay)}</span>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Penalty Pay</span>
              <span className="font-medium">{formatCurrency(summary.totalPenaltyPay)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center text-lg">
              <span className="font-bold">Gross Pay</span>
              <span className="font-bold text-primary">{formatCurrency(summary.grossPay)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
