
// Function to extract a date from a message using natural language processing
export function extractDateFromMessage(message: string): Date | null {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Check for "today" mention
  if (message.toLowerCase().includes('today')) {
    return today;
  }
  
  // Check for "tomorrow" mention
  if (message.toLowerCase().includes('tomorrow')) {
    return tomorrow;
  }
  
  // Check for days of the week
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayMentions = days.filter(day => message.toLowerCase().includes(day));
  
  if (dayMentions.length > 0) {
    const targetDay = days.indexOf(dayMentions[0]);
    const result = new Date(today);
    const currentDay = today.getDay();
    const daysUntilTarget = (targetDay + 7 - currentDay) % 7 || 7; // if it's 0, use 7 to go to next week
    
    result.setDate(today.getDate() + daysUntilTarget);
    return result;
  }
  
  // If no date is explicitly mentioned, return null
  return null;
}

// Format date for the database (YYYY-MM-DD)
export function formatDateForDB(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}
