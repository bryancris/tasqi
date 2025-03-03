
import {
  addDays, addHours, addMinutes as _addMinutes, addMonths, addWeeks, addYears,
  differenceInMinutes as _differenceInMinutes,
  format as _format,
  formatDistanceToNow as _formatDistanceToNow,
  parseISO as _parseISO,
  isToday as _isToday,
  isTomorrow,
  isYesterday,
  isThisWeek,
  isThisMonth
} from "https://esm.sh/date-fns@2.29.3";

// Re-export date-fns functions
export const addMinutes = _addMinutes;
export const differenceInMinutes = _differenceInMinutes;
export const format = _format;
export const formatDistanceToNow = _formatDistanceToNow;
export const parseISO = _parseISO;
export const isToday = _isToday;

// Export other date-fns functions we might use
export {
  addDays, addHours, addMonths, addWeeks, addYears,
  isTomorrow, isYesterday, isThisWeek, isThisMonth
};

/**
 * Add specified time units to a date
 * @param date Base date to modify
 * @param duration Object with time units to add
 * @returns New date with added time
 */
export function add(date: Date, duration: { 
  years?: number; 
  months?: number; 
  weeks?: number; 
  days?: number; 
  hours?: number; 
  minutes?: number; 
  seconds?: number;
}): Date {
  let result = new Date(date);
  
  if (duration.years) result = addYears(result, duration.years);
  if (duration.months) result = addMonths(result, duration.months);
  if (duration.weeks) result = addWeeks(result, duration.weeks);
  if (duration.days) result = addDays(result, duration.days);
  if (duration.hours) result = addHours(result, duration.hours);
  if (duration.minutes) result = addMinutes(result, duration.minutes);
  if (duration.seconds) result = addMinutes(result, duration.seconds / 60);
  
  return result;
}

/**
 * Parse a human-readable date string into a standardized date format
 */
export function parseDateString(dateStr: string): string | null {
  if (!dateStr) return null;
  
  // TODO: Implement more advanced date parsing if needed
  // For now, just passing through as is
  return dateStr;
}
