
// Extract date from a message string
export function extractDateFromMessage(message: string): Date | null {
  // Look for common date patterns in the message
  
  // Check for "today"
  if (message.toLowerCase().includes('today')) {
    return new Date();
  }
  
  // Check for "tomorrow"
  if (message.toLowerCase().includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  
  // Check for days of the week (e.g., "on Monday")
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < daysOfWeek.length; i++) {
    if (message.toLowerCase().includes(daysOfWeek[i])) {
      const today = new Date();
      const currentDay = today.getDay();
      const daysUntilTarget = (i - currentDay + 7) % 7;
      
      // If the day is today but referred by name, don't add days
      if (daysUntilTarget === 0 && message.toLowerCase().includes('this ' + daysOfWeek[i])) {
        return today;
      }
      
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
      return targetDate;
    }
  }
  
  // Check for "next week"
  if (message.toLowerCase().includes('next week')) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  }
  
  // No recognized date pattern found
  return null;
}

// Format a date for storing in the database
export function formatDateForDB(date: Date): string {
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
}
