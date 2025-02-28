
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
  
  // Extract time if present (simple regex for common time formats)
  let startTime = null;
  let endTime = null;
  
  // Look for time patterns like "3:00 PM", "15:00", "3 PM", etc.
  const timeRegex = /\b((1[0-2]|0?[1-9])(?::([0-5][0-9]))?\s*(am|pm)|([01]?[0-9]|2[0-3]):([0-5][0-9]))\b/gi;
  const timeMatches = taskText.match(timeRegex);
  
  if (timeMatches && timeMatches.length > 0) {
    // Convert to 24-hour format for database
    const firstTime = timeMatches[0];
    let hours = 0;
    let minutes = 0;
    
    // Parse the time string
    if (firstTime.toLowerCase().includes('am') || firstTime.toLowerCase().includes('pm')) {
      // Handle "3:00 PM" or "3 PM" format
      const isPM = firstTime.toLowerCase().includes('pm');
      const timeComponents = firstTime.replace(/\s*(am|pm)/i, '').split(':');
      
      hours = parseInt(timeComponents[0], 10);
      minutes = timeComponents.length > 1 ? parseInt(timeComponents[1], 10) : 0;
      
      // Adjust hours for PM
      if (isPM && hours < 12) hours += 12;
      // Adjust for 12 AM
      if (!isPM && hours === 12) hours = 0;
    } else {
      // Handle "15:00" format
      const timeComponents = firstTime.split(':');
      hours = parseInt(timeComponents[0], 10);
      minutes = parseInt(timeComponents[1], 10);
    }
    
    // Format as HH:MM:SS for database
    startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    
    // Set end time to 1 hour after start time by default
    const endHours = (hours + 1) % 24;
    endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    
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
