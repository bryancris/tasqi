
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { formatDateForDB } from './dateUtils.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
const supabase = createClient(supabaseUrl, supabaseKey)

// Check if a message appears to be a task query
export function isTaskQueryRequest(message: string): boolean {
  const taskQueryKeywords = [
    'what tasks', 'my tasks', 'show tasks', 'list tasks', 'view tasks',
    'show my tasks', 'list my tasks', 'view my tasks',
    'what do i have', 'what appointments', 'what meetings',
    'what is scheduled', 'what\'s scheduled'
  ];
  
  return taskQueryKeywords.some(keyword => message.toLowerCase().includes(keyword));
}

// Get tasks for a specific date
export async function getTasksForDate(userId: string, date: Date): Promise<any[]> {
  const formattedDate = formatDateForDB(date);
  
  // Query for tasks that belong to this user and are scheduled for this date
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('date', formattedDate)
    .order('start_time', { ascending: true });
  
  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
  
  return data || [];
}

// Get unscheduled tasks
export async function getUnscheduledTasks(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'unscheduled')
    .order('position', { ascending: true });
  
  if (error) {
    console.error('Error fetching unscheduled tasks:', error);
    return [];
  }
  
  return data || [];
}

// Generate a summary of tasks
export function generateTaskSummary(tasks: any[], date: Date): string {
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  
  if (tasks.length === 0) {
    return `You don't have any tasks scheduled for ${dateStr}.`;
  }
  
  let summary = `For ${dateStr}, you have ${tasks.length} task${tasks.length === 1 ? '' : 's'}:\n\n`;
  
  tasks.forEach((task, index) => {
    let taskInfo = `${index + 1}. ${task.title}`;
    
    if (task.start_time) {
      // Convert time from 24-hour format to 12-hour format with AM/PM
      const startTimeParts = task.start_time.split(':');
      const hour = parseInt(startTimeParts[0], 10);
      const minute = parseInt(startTimeParts[1], 10);
      
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM
      
      const formattedTime = `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
      taskInfo += ` at ${formattedTime}`;
    }
    
    if (task.priority === 'high') {
      taskInfo += " (High Priority)";
    }
    
    summary += taskInfo + '\n';
  });
  
  return summary;
}

// Get count of tasks for a specific date
export async function getTaskCountForDate(userId: string, date: Date): Promise<number> {
  const formattedDate = formatDateForDB(date);
  
  // Query for tasks that belong to this user, are scheduled for this date, and aren't completed
  const { count, error } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('date', formattedDate)
    .not('status', 'eq', 'completed');
  
  if (error) {
    console.error('Error counting tasks:', error);
    return 0;
  }
  
  return count || 0;
}

// Get count of unscheduled tasks
export async function getUnscheduledTaskCount(userId: string): Promise<number> {
  // Query for tasks that belong to this user and are unscheduled
  const { count, error } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'unscheduled');
  
  if (error) {
    console.error('Error counting unscheduled tasks:', error);
    return 0;
  }
  
  return count || 0;
}

// Check if a message appears to be a task creation request
export function isTaskCreationRequest(message: string): boolean {
  // Common phrases that might indicate a task creation request
  const taskCreationPhrases = [
    'add task', 'create task', 'make task', 'new task',
    'add a task', 'create a task', 'schedule task', 'schedule a task',
    'remind me to', 'i need to', 'schedule an appointment', 'add appointment',
    'set up meeting', 'schedule meeting'
  ];
  
  return taskCreationPhrases.some(phrase => message.toLowerCase().includes(phrase));
}

// Create a task from a message
export async function createTaskFromMessage(message: string, userId: string): Promise<boolean> {
  try {
    // Extract task title from message
    // This is a simple implementation - in a real app, you might use NLP for better extraction
    let title = message;
    
    // Remove common prefixes
    const prefixes = ['add task ', 'create task ', 'add a task ', 'create a task ', 'remind me to ', 'i need to '];
    for (const prefix of prefixes) {
      if (title.toLowerCase().startsWith(prefix)) {
        title = title.substring(prefix.length);
        break;
      }
    }
    
    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);
    
    // Extract date if present, default to null (unscheduled)
    let taskDate = null;
    let taskStatus = 'unscheduled';
    
    // For now, use a basic approach to check for dates
    if (message.toLowerCase().includes('today')) {
      taskDate = formatDateForDB(new Date());
      taskStatus = 'scheduled';
    } else if (message.toLowerCase().includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      taskDate = formatDateForDB(tomorrow);
      taskStatus = 'scheduled';
    }
    
    // Get the highest position value for proper ordering
    const { data: positionData } = await supabase
      .from('tasks')
      .select('position')
      .order('position', { ascending: false })
      .limit(1);
    
    const position = (positionData && positionData.length > 0) ? positionData[0].position + 1000 : 1000;
    
    // Create the task
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title,
        date: taskDate,
        status: taskStatus,
        priority: 'medium',
        user_id: userId,
        owner_id: userId,
        position,
        reminder_enabled: false,
        reminder_time: 15
      })
      .select();
    
    if (error) {
      console.error('Error creating task:', error);
      return false;
    }
    
    console.log('Task created successfully:', data);
    return true;
  } catch (error) {
    console.error('Error in createTaskFromMessage:', error);
    return false;
  }
}
