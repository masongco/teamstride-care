import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ShiftEntry } from '@/hooks/usePayrollCalculator';

interface ShiftEntryFormProps {
  onAddShift: (shift: Omit<ShiftEntry, 'id'>) => void;
}

export function ShiftEntryForm({ onAddShift }: ShiftEntryFormProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [breakMinutes, setBreakMinutes] = useState('30');
  const [isPublicHoliday, setIsPublicHoliday] = useState(false);
  const [isOvertime, setIsOvertime] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onAddShift({
      date: format(date, 'yyyy-MM-dd'),
      startTime,
      endTime,
      breakMinutes: parseInt(breakMinutes) || 0,
      isPublicHoliday,
      isOvertime,
    });

    // Reset form for next entry
    setDate(new Date());
    setStartTime('09:00');
    setEndTime('17:00');
    setBreakMinutes('30');
    setIsPublicHoliday(false);
    setIsOvertime(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Date Picker */}
        <div className="space-y-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Start Time */}
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>

        {/* End Time */}
        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>

        {/* Break Minutes */}
        <div className="space-y-2">
          <Label htmlFor="breakMinutes">Break (mins)</Label>
          <Input
            id="breakMinutes"
            type="number"
            min="0"
            max="120"
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(e.target.value)}
            placeholder="30"
          />
        </div>

        {/* Add Button */}
        <div className="space-y-2">
          <Label className="invisible">Add</Label>
          <Button type="submit" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Shift
          </Button>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="publicHoliday"
            checked={isPublicHoliday}
            onCheckedChange={(checked) => setIsPublicHoliday(checked === true)}
          />
          <Label htmlFor="publicHoliday" className="text-sm cursor-pointer">
            Public Holiday
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="overtime"
            checked={isOvertime}
            onCheckedChange={(checked) => setIsOvertime(checked === true)}
          />
          <Label htmlFor="overtime" className="text-sm cursor-pointer">
            Overtime
          </Label>
        </div>
      </div>
    </form>
  );
}
