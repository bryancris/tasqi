
import { createClient } from '@supabase/supabase-js';
import { formatISO, parseISO, addDays, format, isValid, parse } from 'https://esm.sh/date-fns@3.6.0';

// Time related regular expressions
const TIME_REGEX = /\b((1[0-2]|0?[1-9])(?::([0-5][0-9]))?\s*(am|pm|a|p)|([01]?[0-9]|2[0-3]):([0-5][0-9]))\b/gi;
const SHORT_TIME_REGEX = /\b(1[0-2]|0?[1-9])(?:\s*)(a|p)\b/gi;
const OCLOCK_REGEX = /\b(1[0-2]|0?[1-9])\s*(?:o'?clock)\s*(?:in\s+the\s+)?(morning|afternoon|evening)?\b/gi;
const TIME_PERIOD_REGEX = /\b(morning|afternoon|evening|noon|midnight)\b/gi;

// Default times for periods
const TIME_DEFAULTS = {
  morning: '09:00:00',
  afternoon: '14:00:00',
  evening: '19:00:00',
  noon: '12:00:00',
  midnight: '00:00:00'
};

/**
 * Processes a message to extract date and time information.
 * Returns extracted data in a format ready for task creation.
 */
export async function processMessage(message: string, userId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Extract dates using various formats and natural language
  const dateInfo = extractDateInfo(message);
  const timeInfo = extractTimeInfo(message);

  // Extract task-related information
  const taskTitle = extractTaskTitle(message);
  const priority = extractPriority(message) || 'medium';
  
  console.log("Extracted info:", {
    dateInfo,
    timeInfo,
    taskTitle,
    priority
  });

  // Calculate event date, start time, and end time based on extracted data
  let isScheduled = false;
  let date = null;
  let startTime = null;
  let endTime = null;

  if (dateInfo) {
    isScheduled = true;
    date = formatISO(dateInfo, { representation: 'date' });
  }

  if (timeInfo) {
    isScheduled = true;
    
    if (timeInfo.startTime) {
      startTime = timeInfo.startTime;
      
      // Set an end time 1 hour after start time if not specified
      if (!timeInfo.endTime) {
        const [hours, minutes] = timeInfo.startTime.split(':').map(Number);
        const newHours = (hours + 1) % 24;
        endTime = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      } else {
        endTime = timeInfo.endTime;
      }
    }
  }

  return {
    title: taskTitle,
    description: message,
    isScheduled,
    date,
    startTime,
    endTime,
    priority,
    userId
  };
}

/**
 * Extracts date information from the message
 * Handles today, tomorrow, day of week, and specific dates
 */
function extractDateInfo(message: string): Date | null {
  const lowerMessage = message.toLowerCase();
  const today = new Date();
  
  // Check for "today"
  if (/\b(today)\b/.test(lowerMessage)) {
    return today;
  }
  
  // Check for "tomorrow"
  if (/\b(tomorrow)\b/.test(lowerMessage)) {
    return addDays(today, 1);
  }
  
  // Check for day of the week
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < daysOfWeek.length; i++) {
    const day = daysOfWeek[i];
    if (new RegExp(`\\b(${day}|${day.substring(0, 3)})\\b`).test(lowerMessage)) {
      const currentDay = today.getDay();
      const targetDay = i;
      const daysToAdd = (targetDay + 7 - currentDay) % 7;
      // If the day is already today, and we're mentioning it, we probably mean next week
      const offset = (daysToAdd === 0) ? 7 : daysToAdd;
      return addDays(today, offset);
    }
  }
  
  // Check for specific date formats: MM/DD, MM/DD/YYYY, Month DD
  const dateRegex = /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])(?:[\/\-](20\d{2}))?\b/g;
  const monthDayRegex = /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\.?\s+(0?[1-9]|[12][0-9]|3[01])(?:st|nd|rd|th)?\b/gi;
  
  // MM/DD or MM/DD/YYYY format
  let match = dateRegex.exec(lowerMessage);
  if (match) {
    const month = parseInt(match[1], 10) - 1; // JavaScript months are 0-based
    const day = parseInt(match[2], 10);
    const year = match[3] ? parseInt(match[3], 10) : today.getFullYear();
    
    const date = new Date(year, month, day);
    if (isValid(date)) {
      return date;
    }
  }
  
  // Month Day format (e.g., "January 1" or "Jan 1")
  match = monthDayRegex.exec(lowerMessage);
  if (match) {
    const monthString = match[1].toLowerCase();
    const months = {
      'january': 0, 'jan': 0,
      'february': 1, 'feb': 1,
      'march': 2, 'mar': 2,
      'april': 3, 'apr': 3,
      'may': 4,
      'june': 5, 'jun': 5,
      'july': 6, 'jul': 6,
      'august': 7, 'aug': 7,
      'september': 8, 'sep': 8, 'sept': 8,
      'october': 9, 'oct': 9,
      'november': 10, 'nov': 10,
      'december': 11, 'dec': 11
    };
    
    // @ts-ignore: monthString key is validated by regex
    const month = months[monthString];
    const day = parseInt(match[2], 10);
    
    // Set year appropriately (if month/day has passed this year, use next year)
    let year = today.getFullYear();
    const tentativeDate = new Date(year, month, day);
    if (tentativeDate < today) {
      year++;
    }
    
    const date = new Date(year, month, day);
    if (isValid(date)) {
      return date;
    }
  }
  
  return null;
}

/**
 * Extracts time information from a message
 */
function extractTimeInfo(message: string): { startTime: string | null, endTime: string | null } | null {
  const lowerMessage = message.toLowerCase();
  let startTime: string | null = null;
  let endTime: string | null = null;

  // Check for time periods (morning, afternoon, evening, noon, midnight)
  const periodMatch = lowerMessage.match(TIME_PERIOD_REGEX);
  if (periodMatch) {
    const period = periodMatch[0].toLowerCase();
    startTime = TIME_DEFAULTS[period as keyof typeof TIME_DEFAULTS];
    
    // Calculate end time one hour later
    if (startTime) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const newHours = (hours + 1) % 24;
      endTime = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }
    
    return { startTime, endTime };
  }
  
  // Check for o'clock format
  let match = OCLOCK_REGEX.exec(lowerMessage);
  if (match) {
    let hours = parseInt(match[1], 10);
    const period = match[2]?.toLowerCase();
    
    // Adjust hours based on period or context
    if (period === 'afternoon' || period === 'evening') {
      if (hours < 12) hours += 12;
    } else if (!period && hours < 7) {
      // Assume PM for ambiguous times between 1-6 without AM/PM
      hours += 12;
    }
    
    startTime = `${hours.toString().padStart(2, '0')}:00:00`;
    const newHours = (hours + 1) % 24;
    endTime = `${newHours.toString().padStart(2, '0')}:00:00`;
    
    return { startTime, endTime };
  }
  
  // Check for short format like "3p" or "11a"
  match = SHORT_TIME_REGEX.exec(lowerMessage);
  if (match) {
    let hours = parseInt(match[1], 10);
    const ampm = match[2]?.toLowerCase();
    
    // Adjust hours for PM
    if (ampm === 'p' && hours < 12) {
      hours += 12;
    }
    // Adjust 12 AM to 0 hours
    else if (ampm === 'a' && hours === 12) {
      hours = 0;
    }
    
    startTime = `${hours.toString().padStart(2, '0')}:00:00`;
    const newHours = (hours + 1) % 24;
    endTime = `${newHours.toString().padStart(2, '0')}:00:00`;
    
    return { startTime, endTime };
  }
  
  // Check standard time formats (3:00 PM, 15:00)
  match = TIME_REGEX.exec(lowerMessage);
  if (match) {
    // Handle standard formats
    let timeString = match[0];
    let parsedTime;
    
    if (timeString.includes(':')) {
      // Has hours and minutes (3:30 PM or 15:30)
      if (timeString.toLowerCase().includes('am') || timeString.toLowerCase().includes('pm')) {
        // 12-hour format with AM/PM
        parsedTime = parse(timeString, 'h:mm a', new Date());
      } else {
        // 24-hour format
        parsedTime = parse(timeString, 'HH:mm', new Date());
      }
    } else {
      // Only hours (3 PM or 15)
      if (timeString.toLowerCase().includes('am') || timeString.toLowerCase().includes('pm')) {
        // 12-hour format with AM/PM
        parsedTime = parse(timeString, 'h a', new Date());
      } else {
        // 24-hour format or ambiguous
        let hours = parseInt(timeString, 10);
        
        // Default assumption for ambiguous times
        if (hours >= 1 && hours <= 6) {
          // Assume PM for 1-6 without AM/PM
          hours += 12;
        }
        
        parsedTime = new Date();
        parsedTime.setHours(hours, 0, 0);
      }
    }
    
    if (isValid(parsedTime)) {
      startTime = format(parsedTime, 'HH:mm:ss');
      
      // Set end time to 1 hour later
      const endTimeDate = new Date(parsedTime);
      endTimeDate.setHours(endTimeDate.getHours() + 1);
      endTime = format(endTimeDate, 'HH:mm:ss');
      
      return { startTime, endTime };
    }
  }
  
  // Check for a second time to determine end time
  // Reset the regex index
  TIME_REGEX.lastIndex = 0;
  let matches = [];
  let m;
  while ((m = TIME_REGEX.exec(lowerMessage)) !== null) {
    matches.push(m[0]);
  }
  
  if (matches.length >= 2) {
    // Process the second time for end time
    let secondTimeString = matches[1];
    let parsedEndTime;
    
    if (secondTimeString.includes(':')) {
      if (secondTimeString.toLowerCase().includes('am') || secondTimeString.toLowerCase().includes('pm')) {
        parsedEndTime = parse(secondTimeString, 'h:mm a', new Date());
      } else {
        parsedEndTime = parse(secondTimeString, 'HH:mm', new Date());
      }
    } else {
      if (secondTimeString.toLowerCase().includes('am') || secondTimeString.toLowerCase().includes('pm')) {
        parsedEndTime = parse(secondTimeString, 'h a', new Date());
      } else {
        let hours = parseInt(secondTimeString, 10);
        
        // Default assumption for ambiguous times
        if (hours >= 1 && hours <= 6) {
          hours += 12;
        }
        
        parsedEndTime = new Date();
        parsedEndTime.setHours(hours, 0, 0);
      }
    }
    
    if (isValid(parsedEndTime)) {
      endTime = format(parsedEndTime, 'HH:mm:ss');
      
      // If we have both times now, check if end is before start and adjust if needed
      if (startTime && endTime) {
        const startParts = startTime.split(':').map(Number);
        const endParts = endTime.split(':').map(Number);
        
        const startMinutes = startParts[0] * 60 + startParts[1];
        const endMinutes = endParts[0] * 60 + endParts[1];
        
        if (endMinutes < startMinutes) {
          // End time is earlier than start time, assume it's for the next day
          // For now, just swap them as a basic solution
          const temp = startTime;
          startTime = endTime;
          endTime = temp;
        }
      }
    }
  }
  
  // If at least start time is found, return the result
  if (startTime) {
    return { startTime, endTime };
  }
  
  return null;
}

/**
 * Extracts a task title from the message
 */
function extractTaskTitle(message: string): string {
  // Split message into sentences
  const sentences = message.split(/[.!?]\s+/);
  
  // Use the first sentence as the title if it's not too long
  let title = sentences[0].trim();
  
  // Remove phrases like "Schedule a..." or "remind me to..."
  title = title.replace(/^(please\s+)?(schedule|set up|create|add|make|put|set|remind me to|put in)\s+a\s+/i, '');
  title = title.replace(/^(please\s+)?(schedule|set up|create|add|make|put|set|remind me to|put in)\s+/i, '');
  
  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);
  
  // Truncate if too long
  if (title.length > 100) {
    title = title.substring(0, 97) + '...';
  }
  
  return title;
}

/**
 * Extracts priority information from a message
 * Returns 'low', 'medium', or 'high'
 */
function extractPriority(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  
  // Check for explicit priority mentions
  if (/\b(high([ -]priority)?|urgent|important|critical)\b/.test(lowerMessage)) {
    return 'high';
  }
  
  if (/\b(medium([ -]priority)?|normal|regular)\b/.test(lowerMessage)) {
    return 'medium';
  }
  
  if (/\b(low([ -]priority)?|non[ -]urgent|not urgent|unimportant)\b/.test(lowerMessage)) {
    return 'low';
  }
  
  return null;
}

/**
 * Creates a task in the database using the extracted information
 */
export async function createTaskFromMessage(taskData: any) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: existingTasks } = await supabase
    .from("tasks")
    .select("position")
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = existingTasks && existingTasks[0] ? existingTasks[0].position + 1 : 0;

  const { data, error } = await supabase.from("tasks").insert({
    title: taskData.title,
    description: taskData.description,
    date: taskData.date,
    status: taskData.isScheduled ? "scheduled" : "unscheduled",
    start_time: taskData.startTime || null,
    end_time: taskData.endTime || null,
    priority: taskData.priority,
    position: nextPosition,
    reminder_enabled: false,
    reminder_time: 15,
    user_id: taskData.userId,
    owner_id: taskData.userId,
    shared: false
  }).select();

  if (error) throw error;
  return data;
}
