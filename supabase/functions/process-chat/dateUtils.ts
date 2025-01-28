export function convertRelativeDate(dateStr: string): string {
  const today = new Date();
  
  // First check if the date is already in YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateRegex.test(dateStr)) {
    return dateStr;
  }

  // Handle relative date terms
  switch (dateStr.toLowerCase()) {
    case 'today':
      return today.toISOString().split('T')[0];
    case 'tomorrow': {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    case 'next week': {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toISOString().split('T')[0];
    }
    case 'next month': {
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth.toISOString().split('T')[0];
    }
    default:
      console.error('Invalid date format received:', dateStr);
      return today.toISOString().split('T')[0]; // Default to today if format is invalid
  }
}

export function validateTimeFormat(time: string | undefined): string | null {
  if (!time) return null;
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time) ? time : null;
}