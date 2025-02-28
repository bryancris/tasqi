import { format, addDays, addWeeks, addMonths, parse, isValid } from 'date-fns';

export const formatDateForSupabase = (dateString: string): string => {
  return dateString ? format(new Date(dateString), 'yyyy-MM-dd') : '';
};

export const parseRelativeDateReference = (text: string): Date | null => {
  const today = new Date();
  
  // Handle "tomorrow"
  if (/\btomorrow\b/i.test(text)) {
    return addDays(today, 1);
  }
  
  // Handle "next/this week" - set to next Monday
  if (/\bnext\s+week\b/i.test(text)) {
    // Add 7 days to today
    return addDays(today, 7);
  }
  
  // Handle "this week" - keep the same week
  if (/\bthis\s+week\b/i.test(text)) {
    return today;
  }
  
  // Handle "next month"
  if (/\bnext\s+month\b/i.test(text)) {
    return addMonths(today, 1);
  }
  
  // Handle "in X days"
  const inDaysMatch = text.match(/\bin\s+(\d+)\s+days?\b/i);
  if (inDaysMatch && inDaysMatch[1]) {
    const daysToAdd = parseInt(inDaysMatch[1], 10);
    return addDays(today, daysToAdd);
  }
  
  // Handle "in X weeks"
  const inWeeksMatch = text.match(/\bin\s+(\d+)\s+weeks?\b/i);
  if (inWeeksMatch && inWeeksMatch[1]) {
    const weeksToAdd = parseInt(inWeeksMatch[1], 10);
    return addWeeks(today, weeksToAdd);
  }
  
  // Handle specific date formats
  const dateFormats = [
    'yyyy-MM-dd',
    'MM/dd/yyyy',
    'M/d/yyyy',
    'MMMM d, yyyy',
    'MMMM d yyyy',
    'MMM d, yyyy',
    'MMM d yyyy'
  ];
  
  for (const dateFormat of dateFormats) {
    try {
      const parsedDate = parse(text, dateFormat, new Date());
      if (isValid(parsedDate)) {
        return parsedDate;
      }
    } catch (error) {
      // Continue to the next format if parsing fails
      continue;
    }
  }
  
  return null;
};

export const extractDateFromText = (text: string): string | null => {
  // Check for relative date references first
  const relativeDate = parseRelativeDateReference(text);
  if (relativeDate) {
    return format(relativeDate, 'yyyy-MM-dd');
  }
  
  // If no relative date, look for specific date formats
  // This is a fallback and may not be needed with the enhanced parsing above
  const dateRegex = /\b\d{4}-\d{2}-\d{2}\b/;
  const match = text.match(dateRegex);
  
  return match ? match[0] : null;
};
