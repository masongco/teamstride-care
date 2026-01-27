import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ShiftEntry, ShiftCalculation } from '@/hooks/usePayrollCalculator';

interface ShiftsListProps {
  shifts: ShiftEntry[];
  calculations: ShiftCalculation[];
  onRemoveShift: (id: string) => void;
  formatCurrency: (amount: number) => string;
}

export function ShiftsList({ shifts, calculations, onRemoveShift, formatCurrency }: ShiftsListProps) {
  const getCalculation = (shiftId: string) => 
    calculations.find(c => c.shiftId === shiftId);

  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'EEE');
  };

  if (shifts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No shifts added yet</p>
        <p className="text-sm">Add shifts above to calculate payroll</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Pay</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shifts.map((shift) => {
            const calc = getCalculation(shift.id);
            
            return (
              <TableRow key={shift.id}>
                <TableCell>
                  <div>
                    <span className="font-medium">{format(new Date(shift.date), 'dd MMM yyyy')}</span>
                    <span className="text-muted-foreground ml-2">({getDayOfWeek(shift.date)})</span>
                  </div>
                </TableCell>
                <TableCell>
                  {shift.startTime} - {shift.endTime}
                  {shift.breakMinutes > 0 && (
                    <span className="text-muted-foreground text-sm ml-2">
                      ({shift.breakMinutes}m break)
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {calc ? (
                    <span>
                      {calc.workedHours.toFixed(2)} hrs
                    </span>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {shift.isPublicHoliday && (
                      <Badge variant="destructive" className="text-xs">Public Holiday</Badge>
                    )}
                    {shift.isOvertime && (
                      <Badge variant="secondary" className="text-xs">Overtime</Badge>
                    )}
                    {calc && calc.saturdayHours > 0 && (
                      <Badge variant="outline" className="text-xs">Saturday</Badge>
                    )}
                    {calc && calc.sundayHours > 0 && (
                      <Badge variant="outline" className="text-xs">Sunday</Badge>
                    )}
                    {calc && calc.eveningHours > 0 && !shift.isOvertime && (
                      <Badge variant="outline" className="text-xs">Evening</Badge>
                    )}
                    {calc && calc.nightHours > 0 && !shift.isOvertime && (
                      <Badge variant="outline" className="text-xs">Night</Badge>
                    )}
                    {calc && calc.baseHours > 0 && !shift.isPublicHoliday && !shift.isOvertime && (
                      <Badge variant="outline" className="text-xs">Base</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {calc ? formatCurrency(calc.totalPay) : '-'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveShift(shift.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
