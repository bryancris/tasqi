

import { createClient } from '@supabase/supabase-js';
import { extractDateFromText, formatDateForSupabase } from './dateUtils';
import { format } from 'date-fns';

// Initialize the Supabase client with environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const extractTaskDetails = (message: string, taskText: string) => {
  console.log('Extracting task details from:', taskText);
  
  // Extract date if present
  const dateStr = extractDateFromText(taskText);
  console.log('Extracted date:', dateStr);
  
  // Time extraction with improved natural language processing
  let startTime = null;
  let endTime = null;
  
  // Extract time using enhanced natural language processing
  const timeInfo = extractTimeFromText(taskText);
  if (timeInfo) {
    startTime = timeInfo.startTime;
    endTime = timeInfo.endTime;
    console.log('Extracted start time:', startTime);
    console.log('Generated end time:', endTime);
  }

  // Extract priority if mentioned
  let priority = 'low';
  if (/\bhigh priority\b|\bpriority high\b|\burgent\b/i.test(taskText)) {
    priority = 'high';
  } else if (/\bmedium priority\b|\bpriority medium\b|\bmoderate\b/i.test(taskText)) {
    priority = 'medium';
  }
  
  // Determine if task should be scheduled
  const isScheduled = Boolean(dateStr || startTime);
  
  // Determine default title based on the content
  let title = taskText.split(/[.!?]/, 1)[0].trim();
  if (title.length > 100) {
    title = title.substring(0, 97) + '...';
  }
  
  return {
    title,
    description: taskText,
    date: dateStr,
    start_time: startTime,
    end_time: endTime,
    priority,
    is_scheduled: isScheduled,
    status: isScheduled ? 'scheduled' : 'unscheduled'
  };
};

/**
 * Enhanced time extraction function that handles natural language time expressions
 */
function extractTimeFromText(text: string): { startTime: string | null, endTime: string | null } | null {
  console.log('Analyzing text for time expressions:', text);
  
  // Initialize return values
  let startTime: string | null = null;
  let endTime: string | null = null;
  
  // Standardize text for easier matching
  const lowerText = text.toLowerCase();
  
  // Special time words
  if (/\bnoon\b/.test(lowerText)) {
    startTime = '12:00:00';
    endTime = '13:00:00';
    return { startTime, endTime };
  }
  
  if (/\bmidnight\b/.test(lowerText)) {
    startTime = '00:00:00';
    endTime = '01:00:00';
    return { startTime, endTime };
  }
  
  // Handle time periods as defaults
  if (/\b(in the |at )morning\b/.test(lowerText) && !startTime) {
    startTime = '09:00:00';
    endTime = '10:00:00';
    return { startTime, endTime };
  }
  
  if (/\b(in the |at )afternoon\b/.test(lowerText) && !startTime) {
    startTime = '14:00:00';
    endTime = '15:00:00';
    return { startTime, endTime };
  }
  
  if (/\b(in the |at )evening\b/.test(lowerText) && !startTime) {
    startTime = '19:00:00';
    endTime = '20:00:00';
    return { startTime, endTime };
  }
  
  // Match standard time formats with AM/PM
  const standardTimeRegex = /\b(1[0-2]|0?[1-9])(?::([0-5][0-9]))?\s*(am|pm|a\.m\.|p\.m\.|a|p)\b/i;
  const standardTimeMatch = lowerText.match(standardTimeRegex);
  
  if (standardTimeMatch) {
    let hours = parseInt(standardTimeMatch[1], 10);
    const minutes = standardTimeMatch[2] ? parseInt(standardTimeMatch[2], 10) : 0;
    const period = standardTimeMatch[3].charAt(0).toLowerCase();
    
    // Convert to 24-hour format
    if (period === 'p' && hours < 12) {
      hours += 12;
    } else if (period === 'a' && hours === 12) {
      hours = 0;
    }
    
    startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    
    // Set end time to 1 hour after start time
    let endHours = (hours + 1) % 24;
    endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    
    console.log(`Parsed standard time: ${standardTimeMatch[0]} → ${startTime}`);
    return { startTime, endTime };
  }
  
  // Match times with "o'clock" or "oclock"
  const oclockRegex = /\b(1[0-2]|0?[1-9])\s*(?:o'clock|oclock|o clock)\b(?:\s*(am|pm|a\.m\.|p\.m\.|in the (morning|afternoon|evening)))*/i;
  const oclockMatch = lowerText.match(oclockRegex);
  
  if (oclockMatch) {
    let hours = parseInt(oclockMatch[1], 10);
    
    // Determine AM/PM from context
    let isPM = false;
    
    if (oclockMatch[2]) {
      // Explicit AM/PM specified
      isPM = oclockMatch[2].charAt(0).toLowerCase() === 'p';
    } else if (oclockMatch[3]) {
      // Period of day specified
      isPM = oclockMatch[3] === 'afternoon' || oclockMatch[3] === 'evening';
    } else {
      // Use default assumption based on hour
      isPM = (hours >= 1 && hours <= 6) || hours === 12;
    }
    
    // Convert to 24-hour format
    if (isPM && hours < 12) {
      hours += 12;
    } else if (!isPM && hours === 12) {
      hours = 0;
    }
    
    startTime = `${hours.toString().padStart(2, '0')}:00:00`;
    
    // Set end time to 1 hour after start time
    let endHours = (hours + 1) % 24;
    endTime = `${endHours.toString().padStart(2, '0')}:00:00`;
    
    console.log(`Parsed o'clock time: ${oclockMatch[0]} → ${startTime}`);
    return { startTime, endTime };
  }
  
  // Match bare numbers that might be times (with contextual AM/PM assumption)
  const bareNumberRegex = /\b(at |around |approximately |about |@)\s*(1[0-2]|0?[1-9])\b(?:\s*(am|pm|a\.m\.|p\.m\.|in the (morning|afternoon|evening)))*/i;
  const numberMatch = lowerText.match(bareNumberRegex);
  
  if (numberMatch) {
    let hours = parseInt(numberMatch[2], 10);
    
    // Determine AM/PM from context
    let isPM = false;
    
    if (numberMatch[3]) {
      // Explicit AM/PM or period specified
      isPM = numberMatch[3].charAt(0).toLowerCase() === 'p' || 
             numberMatch[3].includes('afternoon') || 
             numberMatch[3].includes('evening');
    } else {
      // Use default assumption based on hour
      isPM = (hours >= 1 && hours <= 6) || hours === 12;
    }
    
    // Convert to 24-hour format
    if (isPM && hours < 12) {
      hours += 12;
    } else if (!isPM && hours === 12) {
      hours = 0;
    }
    
    startTime = `${hours.toString().padStart(2, '0')}:00:00`;
    
    // Set end time to 1 hour after start time
    let endHours = (hours + 1) % 24;
    endTime = `${endHours.toString().padStart(2, '0')}:00:00`;
    
    console.log(`Parsed numbered time: ${numberMatch[0]} → ${startTime}`);
    return { startTime, endTime };
  }
  
  // Match 24-hour format (less common but should be supported)
  const militaryTimeRegex = /\b([01]?[0-9]|2[0-3]):([0-5][0-9])\b/;
  const militaryMatch = lowerText.match(militaryTimeRegex);
  
  if (militaryMatch) {
    const hours = parseInt(militaryMatch[1], 10);
    const minutes = parseInt(militaryMatch[2], 10);
    
    startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    
    // Set end time to 1 hour after start time
    let endHours = (hours + 1) % 24;
    endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    
    console.log(`Parsed 24-hour time: ${militaryMatch[0]} → ${startTime}`);
    return { startTime, endTime };
  }
  
  // Handle informal expressions with time periods
  if (/\b(this |in the |during the |after |before )(morning|afternoon|evening)\b/.test(lowerText) && !startTime) {
    const periodMatch = lowerText.match(/\b(morning|afternoon|evening)\b/);
    if (periodMatch) {
      const period = periodMatch[1];
      
      if (period === 'morning') {
        startTime = '09:00:00';
        endTime = '10:00:00';
      } else if (period === 'afternoon') {
        startTime = '14:00:00';
        endTime = '15:00:00';
      } else if (period === 'evening') {
        startTime = '19:00:00';
        endTime = '20:00:00';
      }
      
      console.log(`Extracted time period: ${period} → ${startTime}`);
      return { startTime, endTime };
    }
  }
  
  // If no time was found
  console.log('No time expression found in text');
  return null;
}

export const createTaskFromChat = async (userId: string, taskDetails: any) => {
  console.log('Creating task with details:', taskDetails);
  
  try {
    // Get the highest position to add the new task at the end
    const { data: existingTasks, error: positionError } = await supabase
      .from('tasks')
      .select('position')
      .order('position', { ascending: false })
      .limit(1);
      
    if (positionError) throw positionError;
    
    const nextPosition = existingTasks && existingTasks.length > 0 ? existingTasks[0].position + 1 : 0;
    
    // Prepare the task data
    const taskData = {
      title: taskDetails.title,
      description: taskDetails.description,
      status: taskDetails.status,
      date: taskDetails.date,
      start_time: taskDetails.start_time,
      end_time: taskDetails.end_time,
      priority: taskDetails.priority,
      user_id: userId,
      owner_id: userId,
      position: nextPosition,
      reminder_enabled: false,
      reminder_time: 15
    };
    
    console.log('Task data to insert:', taskData);
    
    // Insert the task
    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select();
      
    if (error) throw error;
    
    console.log('Task created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const checkForTaskIntent = (message: string): boolean => {
  // Common task-related phrases and keywords
  const taskIntentPatterns = [
    /schedule/i,
    /remind me/i,
    /don't forget/i,
    /need to/i,
    /have to/i,
    /must/i,
    /appointment/i,
    /meeting/i,
    /deadline/i,
    /todo/i,
    /to-do/i,
    /task/i,
    /should complete/i,
    /need to complete/i,
    /assignment/i,
    /project/i
  ];
  
  // Temporal indicators that often indicate tasks
  const timePatterns = [
    /today/i,
    /tomorrow/i,
    /next week/i,
    /on monday/i,
    /on tuesday/i,
    /on wednesday/i,
    /on thursday/i,
    /on friday/i,
    /on saturday/i,
    /on sunday/i,
    /\d{1,2}:\d{2}/i, // Time pattern like 3:30
    /\d{1,2}\s*(am|pm)/i, // Time pattern like 3 pm
    /\d{4}-\d{2}-\d{2}/i // ISO date
  ];
  
  // Check for task intent patterns
  for (const pattern of taskIntentPatterns) {
    if (pattern.test(message)) return true;
  }
  
  // Check for time patterns
  for (const pattern of timePatterns) {
    if (pattern.test(message)) return true;
  }
  
  return false;
};
