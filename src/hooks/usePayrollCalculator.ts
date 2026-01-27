import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AwardClassification } from '@/hooks/useSettings';

export interface ShiftEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  isPublicHoliday: boolean;
  isOvertime: boolean;
}

export interface ShiftCalculation {
  shiftId: string;
  date: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  breakHours: number;
  workedHours: number;
  baseHours: number;
  eveningHours: number;
  nightHours: number;
  saturdayHours: number;
  sundayHours: number;
  publicHolidayHours: number;
  overtimeHours: number;
  basePay: number;
  eveningPay: number;
  nightPay: number;
  saturdayPay: number;
  sundayPay: number;
  publicHolidayPay: number;
  overtimePay: number;
  totalPay: number;
}

export interface PayrollSummary {
  totalHours: number;
  totalWorkedHours: number;
  baseHours: number;
  penaltyHours: number;
  basePay: number;
  eveningPay: number;
  nightPay: number;
  saturdayPay: number;
  sundayPay: number;
  publicHolidayPay: number;
  overtimePay: number;
  totalPenaltyPay: number;
  grossPay: number;
}

// Time ranges for penalty rates (in 24h format)
const EVENING_START = 18; // 6 PM
const EVENING_END = 23;   // 11 PM
const NIGHT_START = 23;   // 11 PM
const NIGHT_END = 6;      // 6 AM

export function usePayrollCalculator() {
  const [awardClassifications, setAwardClassifications] = useState<AwardClassification[]>([]);
  const [selectedAward, setSelectedAward] = useState<AwardClassification | null>(null);
  const [shifts, setShifts] = useState<ShiftEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAwards = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('award_classifications')
        .select('*')
        .order('name');

      if (!error && data) {
        setAwardClassifications(data as AwardClassification[]);
        if (data.length > 0) {
          setSelectedAward(data[0] as AwardClassification);
        }
      }
      setLoading(false);
    };

    fetchAwards();
  }, []);

  const addShift = (shift: Omit<ShiftEntry, 'id'>) => {
    const newShift: ShiftEntry = {
      ...shift,
      id: crypto.randomUUID(),
    };
    setShifts(prev => [...prev, newShift]);
  };

  const updateShift = (id: string, updates: Partial<ShiftEntry>) => {
    setShifts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeShift = (id: string) => {
    setShifts(prev => prev.filter(s => s.id !== id));
  };

  const clearShifts = () => {
    setShifts([]);
  };

  const calculateHoursInRange = (
    startHour: number,
    startMinute: number,
    endHour: number,
    endMinute: number,
    rangeStart: number,
    rangeEnd: number
  ): number => {
    const startDecimal = startHour + startMinute / 60;
    const endDecimal = endHour + endMinute / 60;

    // Handle overnight ranges (like night shift 23:00 - 06:00)
    if (rangeStart > rangeEnd) {
      // Split into two ranges: rangeStart-24 and 0-rangeEnd
      const firstPartHours = calculateHoursInRange(
        startHour, startMinute, endHour, endMinute,
        rangeStart, 24
      );
      const secondPartHours = calculateHoursInRange(
        startHour, startMinute, endHour, endMinute,
        0, rangeEnd
      );
      return firstPartHours + secondPartHours;
    }

    // Normal range
    const overlapStart = Math.max(startDecimal, rangeStart);
    const overlapEnd = Math.min(endDecimal, rangeEnd);

    if (overlapEnd > overlapStart) {
      return overlapEnd - overlapStart;
    }

    return 0;
  };

  const calculateShift = (shift: ShiftEntry): ShiftCalculation | null => {
    if (!selectedAward) return null;

    const [startHour, startMinute] = shift.startTime.split(':').map(Number);
    const [endHour, endMinute] = shift.endTime.split(':').map(Number);
    
    // Calculate total hours (handle overnight shifts)
    let totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60; // Add 24 hours for overnight
    }
    
    const totalHours = totalMinutes / 60;
    const breakHours = shift.breakMinutes / 60;
    const workedHours = Math.max(0, totalHours - breakHours);

    // Get day of week (0 = Sunday, 6 = Saturday)
    const shiftDate = new Date(shift.date);
    const dayOfWeek = shiftDate.getDay();
    const isSaturday = dayOfWeek === 6;
    const isSunday = dayOfWeek === 0;

    let baseHours = 0;
    let eveningHours = 0;
    let nightHours = 0;
    let saturdayHours = 0;
    let sundayHours = 0;
    let publicHolidayHours = 0;
    let overtimeHours = 0;

    // Calculate hours by time period
    if (shift.isPublicHoliday) {
      publicHolidayHours = workedHours;
    } else if (isSaturday) {
      saturdayHours = workedHours;
    } else if (isSunday) {
      sundayHours = workedHours;
    } else {
      // Calculate evening hours (6 PM - 11 PM)
      eveningHours = calculateHoursInRange(
        startHour, startMinute, endHour, endMinute,
        EVENING_START, EVENING_END
      );
      
      // Calculate night hours (11 PM - 6 AM)
      nightHours = calculateHoursInRange(
        startHour, startMinute, endHour, endMinute,
        NIGHT_START, NIGHT_END
      );
      
      // Base hours are the remaining
      baseHours = Math.max(0, workedHours - eveningHours - nightHours);
    }

    // Handle overtime (if marked as overtime, apply multiplier to all hours)
    if (shift.isOvertime) {
      overtimeHours = workedHours;
      // Reset other categories when overtime
      baseHours = 0;
      eveningHours = 0;
      nightHours = 0;
    }

    // Calculate pay
    const baseRate = selectedAward.base_hourly_rate;
    
    const basePay = baseHours * baseRate;
    const eveningPay = eveningHours * baseRate * selectedAward.evening_multiplier;
    const nightPay = nightHours * baseRate * selectedAward.night_multiplier;
    const saturdayPay = saturdayHours * baseRate * selectedAward.saturday_multiplier;
    const sundayPay = sundayHours * baseRate * selectedAward.sunday_multiplier;
    const publicHolidayPay = publicHolidayHours * baseRate * selectedAward.public_holiday_multiplier;
    const overtimePay = overtimeHours * baseRate * selectedAward.overtime_multiplier;

    const totalPay = basePay + eveningPay + nightPay + saturdayPay + sundayPay + publicHolidayPay + overtimePay;

    return {
      shiftId: shift.id,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      totalHours,
      breakHours,
      workedHours,
      baseHours,
      eveningHours,
      nightHours,
      saturdayHours,
      sundayHours,
      publicHolidayHours,
      overtimeHours,
      basePay,
      eveningPay,
      nightPay,
      saturdayPay,
      sundayPay,
      publicHolidayPay,
      overtimePay,
      totalPay,
    };
  };

  const calculations = useMemo<ShiftCalculation[]>(() => {
    return shifts
      .map(calculateShift)
      .filter((calc): calc is ShiftCalculation => calc !== null);
  }, [shifts, selectedAward]);

  const summary = useMemo<PayrollSummary>(() => {
    const initial: PayrollSummary = {
      totalHours: 0,
      totalWorkedHours: 0,
      baseHours: 0,
      penaltyHours: 0,
      basePay: 0,
      eveningPay: 0,
      nightPay: 0,
      saturdayPay: 0,
      sundayPay: 0,
      publicHolidayPay: 0,
      overtimePay: 0,
      totalPenaltyPay: 0,
      grossPay: 0,
    };

    return calculations.reduce((acc, calc) => {
      acc.totalHours += calc.totalHours;
      acc.totalWorkedHours += calc.workedHours;
      acc.baseHours += calc.baseHours;
      acc.penaltyHours += calc.eveningHours + calc.nightHours + calc.saturdayHours + calc.sundayHours + calc.publicHolidayHours + calc.overtimeHours;
      acc.basePay += calc.basePay;
      acc.eveningPay += calc.eveningPay;
      acc.nightPay += calc.nightPay;
      acc.saturdayPay += calc.saturdayPay;
      acc.sundayPay += calc.sundayPay;
      acc.publicHolidayPay += calc.publicHolidayPay;
      acc.overtimePay += calc.overtimePay;
      acc.totalPenaltyPay += calc.eveningPay + calc.nightPay + calc.saturdayPay + calc.sundayPay + calc.publicHolidayPay + calc.overtimePay;
      acc.grossPay += calc.totalPay;
      return acc;
    }, initial);
  }, [calculations]);

  return {
    awardClassifications,
    selectedAward,
    setSelectedAward,
    shifts,
    addShift,
    updateShift,
    removeShift,
    clearShifts,
    calculations,
    summary,
    loading,
  };
}
