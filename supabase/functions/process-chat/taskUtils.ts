
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { formatDateForDB } from './dateUtils.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
const supabase = createClient(supabaseUrl, supabaseKey)

export function isTaskQueryRequest(message: string): boolean {
  const queryPhrases = [
    "what tasks",
    "my tasks",
    "tasks for",
    "do i have",
    "what do i have",
    "what are my",
    "show me my tasks",
    "show my tasks",
    "list my tasks",
    "view my tasks",
    "see my tasks",
  ];
  
  const lowerMessage = message.toLowerCase();
  return queryPhrases.some(phrase => lowerMessage.includes(phrase));
}

export async function getTaskCountForDate(userId: string, date: Date): Promise<number> {
  const formattedDate = formatDateForDB(date);
  
  const { data, error } = await supabase
    .from('tasks')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('date', formattedDate)
    .eq('status', 'scheduled');
  
  if (error) {
    console.error('Error getting task count:', error);
    throw error;
  }
  
  return data?.length || 0;
}

export async function getTasksForDate(userId: string, date: Date): Promise<any[]> {
  const formattedDate = formatDateForDB(date);
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('date', formattedDate);
  
  if (error) {
    console.error('Error getting tasks:', error);
    throw error;
  }
  
  return data || [];
}

export function generateTaskSummary(tasks: any[], date: Date): string {
  if (tasks.length === 0) {
    return `You don't have any tasks scheduled for ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.`;
  }
  
  const taskCount = tasks.length;
  const dateString = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  
  let summary = `You have ${taskCount} task${taskCount === 1 ? '' : 's'} for ${dateString}:\n\n`;
  
  tasks.forEach((task, index) => {
    const timeInfo = task.start_time 
      ? `at ${formatTime(task.start_time)}` 
      : '';
    
    summary += `${index + 1}. ${task.title} ${timeInfo}\n`;
  });
  
  return summary;
}

export async function createTaskFromMessage(message: string, userId: string): Promise<void> {
  try {
    // Extract a title from the message (simple implementation)
    const title = extractTaskTitle(message);
    
    // Extract date if provided in the message, otherwise default to today
    const date = extractDateFromMessage(message) || new Date();
    const formattedDate = formatDateForDB(date);
    
    // Extract time if provided (simple implementation)
    const timeMatch = message.match(/at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    let startTime = null;
    
    if (timeMatch) {
      startTime = parseTime(timeMatch[1]);
    }
    
    // Determine if this is a scheduled or unscheduled task
    const status = formattedDate ? 'scheduled' : 'unscheduled';
    
    // Create the task
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          title,
          date: formattedDate,
          start_time: startTime,
          status,
          user_id: userId,
          priority: 'medium',
        }
      ]);
    
    if (error) throw error;
    
    console.log('Task created successfully:', data);
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

// Helper functions
function extractTaskTitle(message: string): string {
  // Remove common task creation phrases
  let title = message;
  const phrasesToRemove = [
    "add task ",
    "create task ",
    "new task ",
    "remind me to ",
    "need to ",
    "have to ",
    "got to ",
    "gotta ",
  ];
  
  phrasesToRemove.forEach(phrase => {
    if (title.toLowerCase().includes(phrase)) {
      title = title.replace(new RegExp(phrase, 'i'), '');
    }
  });
  
  // Remove time information if present
  title = title.replace(/\bat\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/i, '');
  
  // Remove date information
  const datePatterns = [
    /\bon\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\btoday\b/i,
    /\btomorrow\b/i,
    /\bnext\s+week\b/i,
  ];
  
  datePatterns.forEach(pattern => {
    title = title.replace(pattern, '');
  });
  
  // Trim extra spaces and capitalize first letter
  title = title.trim();
  title = title.charAt(0).toUpperCase() + title.slice(1);
  
  return title;
}

function formatTime(timeString: string): string {
  if (!timeString) return '';
  
  // Simple formatting - convert "15:00:00" to "3:00 PM"
  const date = new Date(`2000-01-01T${timeString}`);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function parseTime(timeString: string): string | null {
  try {
    if (!timeString) return null;
    
    // Handle 24-hour format
    const hourMinuteRegex = /(\d{1,2})(?::(\d{2}))?/;
    const match = timeString.match(hourMinuteRegex);
    
    if (!match) return null;
    
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    
    // Check for AM/PM
    if (timeString.toLowerCase().includes('pm') && hours < 12) {
      hours += 12;
    } else if (timeString.toLowerCase().includes('am') && hours === 12) {
      hours = 0;
    }
    
    // Format as HH:MM:00
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  } catch (error) {
    console.error('Error parsing time:', error);
    return null;
  }
}

export function extractDateFromMessage(message: string): Date | null {
  // Re-using from dateUtils to avoid circular imports
  const today = new Date();
  
  // Check for "today" mention
  if (message.toLowerCase().includes('today')) {
    return today;
  }
  
  // Check for "tomorrow" mention
  if (message.toLowerCase().includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  
  // Check for days of the week
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayMentions = days.filter(day => message.toLowerCase().includes(day));
  
  if (dayMentions.length > 0) {
    const targetDay = days.indexOf(dayMentions[0]);
    const result = new Date(today);
    const currentDay = today.getDay();
    const daysUntilTarget = (targetDay + 7 - currentDay) % 7 || 7;
    
    result.setDate(today.getDate() + daysUntilTarget);
    return result;
  }
  
  // If no date is explicitly mentioned, return null
  return null;
}
