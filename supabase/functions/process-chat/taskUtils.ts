
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  format, 
  parse, 
  parseISO, 
  isValid, 
  addDays 
} from './dateUtils.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to extract time from various formats
export function extractTime(text: string): string | null {
  // Check for common time patterns
  
  // Handle "noon" and "midnight" special cases
  if (text.toLowerCase().includes('noon')) {
    return '12:00:00';
  }
  if (text.toLowerCase().includes('midnight')) {
    return '00:00:00';
  }
  
  // Handle time periods: morning, afternoon, evening
  if (text.toLowerCase().includes('morning')) {
    return '09:00:00'; // Default morning time
  }
  if (text.toLowerCase().includes('afternoon')) {
    return '14:00:00'; // Default afternoon time
  }
  if (text.toLowerCase().includes('evening')) {
    return '19:00:00'; // Default evening time
  }
  
  // First, try matching 12-hour format with optional colon: "3pm", "3:30pm", "3 pm"
  const twelveHourPattern = /\b(1[0-2]|0?[1-9])(?::([0-5][0-9]))?\s*(am|pm|a|p)\b/i;
  const twelveHourMatch = text.match(twelveHourPattern);
  
  if (twelveHourMatch) {
    const hour = parseInt(twelveHourMatch[1]);
    const minutes = twelveHourMatch[2] || '00';
    const period = twelveHourMatch[3].toLowerCase();
    
    let hour24 = hour;
    if ((period === 'pm' || period === 'p') && hour < 12) {
      hour24 += 12;
    } else if ((period === 'am' || period === 'a') && hour === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
  }
  
  // Next, try 24-hour format: "15:30"
  const twentyFourHourPattern = /\b([01]?[0-9]|2[0-3]):([0-5][0-9])\b/;
  const twentyFourHourMatch = text.match(twentyFourHourPattern);
  
  if (twentyFourHourMatch) {
    const hour = twentyFourHourMatch[1].padStart(2, '0');
    const minutes = twentyFourHourMatch[2];
    return `${hour}:${minutes}:00`;
  }
  
  // Try to match standalone numbers like "3" (without am/pm)
  const hourOnlyPattern = /\b([0-9]|1[0-2])\b/;
  const hourOnlyMatch = text.match(hourOnlyPattern);
  
  if (hourOnlyMatch) {
    const hour = parseInt(hourOnlyMatch[1]);
    
    // Apply contextual defaults:
    // 1-6 without AM/PM → PM (e.g., "4" → "4:00 PM")
    // 7-11 without AM/PM → AM (e.g., "9" → "9:00 AM")
    // 12 → based on context ("afternoon" → PM)
    
    let hour24 = hour;
    if (hour >= 1 && hour <= 6) {
      hour24 += 12; // Default to PM for 1-6
    }
    // 7-11 stays as is (AM)
    else if (hour === 12) {
      const lowerText = text.toLowerCase();
      // Check context for 12
      if (lowerText.includes('afternoon') || lowerText.includes('evening') || lowerText.includes('night')) {
        hour24 = 12; // 12 PM
      } else {
        hour24 = 0; // 12 AM
      }
    }
    
    return `${hour24.toString().padStart(2, '0')}:00:00`;
  }
  
  return null;
}

// Function to parse and extract task information from a message
export async function processMessage(message: string, userId: string) {
  const today = new Date();
  
  // Default task data
  const taskData = {
    title: '',
    description: '',
    isScheduled: false,
    date: format(today, 'yyyy-MM-dd'),
    startTime: null,
    endTime: null,
    priority: 'medium',
    userId
  };
  
  // Extract title - Use the first sentence or the whole message if it's short
  const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0);
  taskData.title = sentences[0].trim();
  
  // If there are more sentences, use them as description
  if (sentences.length > 1) {
    taskData.description = sentences.slice(1).join('. ').trim();
  }
  
  // Handle date extraction
  const datePatterns = [
    { regex: /today/i, handler: () => format(today, 'yyyy-MM-dd') },
    { regex: /tomorrow/i, handler: () => format(addDays(today, 1), 'yyyy-MM-dd') },
    { regex: /next (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, handler: (match: RegExpMatchArray) => {
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        .indexOf(match[1].toLowerCase());
      let daysToAdd = (dayOfWeek - today.getDay() + 7) % 7;
      if (daysToAdd === 0) daysToAdd = 7; // If today is the same day, go to next week
      return format(addDays(today, daysToAdd), 'yyyy-MM-dd');
    }},
    { regex: /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, handler: (match: RegExpMatchArray) => {
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        .indexOf(match[1].toLowerCase());
      let daysToAdd = (dayOfWeek - today.getDay() + 7) % 7;
      if (daysToAdd === 0) daysToAdd = 7; // If today is the same day, go to next week
      return format(addDays(today, daysToAdd), 'yyyy-MM-dd');
    }},
    // MM/DD format
    { regex: /(\d{1,2})\/(\d{1,2})/i, handler: (match: RegExpMatchArray) => {
      const month = parseInt(match[1]);
      const day = parseInt(match[2]);
      let year = today.getFullYear();
      
      // If the date is earlier than today, assume next year
      const dateInCurrentYear = new Date(year, month - 1, day);
      if (dateInCurrentYear < today) {
        year++;
      }
      
      return format(new Date(year, month - 1, day), 'yyyy-MM-dd');
    }},
    // MMM DD format
    { regex: /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* (\d{1,2})/i, handler: (match: RegExpMatchArray) => {
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const month = monthNames.indexOf(match[1].toLowerCase().substring(0, 3)) + 1;
      const day = parseInt(match[2]);
      let year = today.getFullYear();
      
      // If the date is earlier than today, assume next year
      const dateInCurrentYear = new Date(year, month - 1, day);
      if (dateInCurrentYear < today) {
        year++;
      }
      
      return format(new Date(year, month - 1, day), 'yyyy-MM-dd');
    }}
  ];
  
  // Check each date pattern
  for (const pattern of datePatterns) {
    const match = message.match(pattern.regex);
    if (match) {
      taskData.date = pattern.handler(match);
      taskData.isScheduled = true;
      break;
    }
  }
  
  // Extract time information
  const timeStr = extractTime(message);
  if (timeStr) {
    taskData.startTime = timeStr;
    taskData.isScheduled = true;
    
    // Calculate end time (default to 1 hour later)
    const [hours, minutes] = timeStr.split(':').map(Number);
    const endHour = (hours + 1) % 24;
    taskData.endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  }
  
  // Extract priority
  if (message.match(/\bhigh\s+(priority|importance)\b/i) || message.match(/\bimportant\b/i)) {
    taskData.priority = 'high';
  } else if (message.match(/\blow\s+(priority|importance)\b/i)) {
    taskData.priority = 'low';
  }
  
  console.log('Processed task data:', taskData);
  return taskData;
}

// Function to create a task in the database
export async function createTaskFromMessage(taskData: any) {
  // Get existing user tasks to determine next position
  const { data: existingTasks } = await supabase
    .from("tasks")
    .select("position")
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = existingTasks && existingTasks[0] ? existingTasks[0].position + 1 : 0;
  
  // Prepare the data for insertion
  const taskToInsert = {
    title: taskData.title,
    description: taskData.description || '',
    date: taskData.isScheduled ? taskData.date : null,
    status: taskData.isScheduled ? "scheduled" : "unscheduled",
    start_time: taskData.startTime,
    end_time: taskData.endTime,
    priority: taskData.priority,
    position: nextPosition,
    user_id: taskData.userId,
    owner_id: taskData.userId,
    shared: false
  };
  
  console.log('Inserting task:', taskToInsert);
  
  const { data, error } = await supabase
    .from("tasks")
    .insert(taskToInsert)
    .select();
  
  if (error) {
    console.error('Error creating task:', error);
    throw error;
  }
  
  return data;
}
