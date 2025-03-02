import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { extractDateFromMessage, formatDateForDB } from './dateUtils.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Creates a task from a message
 */
export async function createTaskFromMessage(message: string, userId: string) {
  try {
    // Extract date from message
    const extractedDate = extractDateFromMessage(message)
    const formattedDate = extractedDate ? formatDateForDB(extractedDate) : null

    // Get the highest position for proper ordering
    const { data: positionData, error: positionError } = await supabase
      .from('tasks')
      .select('position')
      .eq('user_id', userId)
      .order('position', { ascending: false })
      .limit(1)

    if (positionError) {
      console.error('Error getting position:', positionError)
      throw positionError
    }

    const nextPosition = positionData && positionData.length > 0 
      ? (positionData[0].position + 1) 
      : 0

    // Create the task
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: message,
        user_id: userId,
        owner_id: userId,
        status: formattedDate ? 'scheduled' : 'unscheduled',
        date: formattedDate,
        position: nextPosition
      })
      .select()

    if (error) {
      console.error('Error creating task:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in createTaskFromMessage:', error)
    throw error
  }
}

/**
 * Checks if a message is asking about tasks (query) rather than creating a task
 */
export function isTaskQueryRequest(message: string): boolean {
  const queryPhrases = [
    'how many tasks', 'what tasks', 'list tasks', 'show tasks', 
    'what are my tasks', 'tasks for today', 'today\'s tasks',
    'pending tasks', 'scheduled tasks', 'what do i have',
    'what\'s on my schedule', 'what is on my schedule',
    'what\'s my schedule', 'what is my schedule'
  ];
  
  const lowerMessage = message.toLowerCase();
  
  return queryPhrases.some(phrase => lowerMessage.includes(phrase));
}

/**
 * Fetches tasks for the specified date and returns them categorized
 */
export async function getTasksForDate(userId: string, date: Date): Promise<{
  pendingTasks: any[];
  completedTasks: any[];
  events: any[];
  totalCount: number;
}> {
  // Get start and end of day in UTC
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);
  
  const formattedDate = startOfDay.toISOString().split('T')[0];
  
  // Fetch tasks for the specified date
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      *,
      task_attachments(*),
      shared_tasks(*)
    `)
    .eq('user_id', userId)
    .eq('date', formattedDate);
  
  if (error) {
    console.error('Error fetching tasks for date:', error);
    throw error;
  }
  
  // Also fetch shared tasks
  const { data: sharedWithUserTasks, error: sharedTasksError } = await supabase
    .from('shared_tasks')
    .select(`
      *,
      task:tasks(
        *,
        task_attachments(*)
      )
    `)
    .eq('shared_with_user_id', userId);

  if (sharedTasksError) {
    console.error('Error fetching shared tasks:', sharedTasksError);
    throw sharedTasksError;
  }
  
  // Process shared tasks and filter by date
  const sharedTasks = sharedWithUserTasks
    .filter(st => st.task) // Filter out null tasks
    .map(st => st.task)
    .filter(task => task.date === formattedDate);
  
  // Combine tasks and shared tasks
  const allTasks = [...(tasks || []), ...(sharedTasks || [])];
  
  // Categorize tasks
  const pendingTasks = allTasks.filter(task => 
    task.status !== 'completed' && task.status !== 'event'
  );
  
  const completedTasks = allTasks.filter(task => 
    task.status === 'completed'
  );
  
  const events = allTasks.filter(task => 
    task.status === 'event'
  );
  
  return {
    pendingTasks,
    completedTasks,
    events,
    totalCount: allTasks.length
  };
}

/**
 * Formats a task for display in the chat
 */
export function formatTaskForDisplay(task: any): string {
  let result = `- ${task.title}`;
  
  // Add priority if available
  if (task.priority) {
    const priorityDisplay = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    result += ` (${priorityDisplay})`;
  }
  
  // Add time if available
  if (task.start_time) {
    const timeParts = task.start_time.split(':');
    const hours = parseInt(timeParts[0]);
    const minutes = timeParts[1];
    
    // Format in 12-hour time
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    result += ` at ${displayHours}:${minutes} ${period}`;
  } else if (task.is_all_day) {
    result += ' (All day)';
  }
  
  return result;
}

/**
 * Generates a summary of tasks for a given date
 */
export function generateTaskSummary(tasks: {
  pendingTasks: any[];
  completedTasks: any[];
  events: any[];
  totalCount: number;
}, date: Date): string {
  const dateString = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const isToday = new Date().toDateString() === date.toDateString();
  const dateLabel = isToday ? 'today' : `on ${dateString}`;
  
  let summary = '';
  
  if (tasks.totalCount === 0) {
    return `You don't have any tasks scheduled ${dateLabel}.`;
  }
  
  summary += `You have ${tasks.totalCount} task${tasks.totalCount !== 1 ? 's' : ''} ${dateLabel}:\n\n`;
  
  // Add pending tasks
  if (tasks.pendingTasks.length > 0) {
    summary += `Pending (${tasks.pendingTasks.length}):\n`;
    tasks.pendingTasks.forEach(task => {
      summary += `${formatTaskForDisplay(task)}\n`;
    });
    summary += '\n';
  }
  
  // Add completed tasks
  if (tasks.completedTasks.length > 0) {
    summary += `Completed (${tasks.completedTasks.length}):\n`;
    tasks.completedTasks.forEach(task => {
      summary += `${formatTaskForDisplay(task)}\n`;
    });
    summary += '\n';
  }
  
  // Add events
  if (tasks.events.length > 0) {
    summary += `Events (${tasks.events.length}):\n`;
    tasks.events.forEach(event => {
      summary += `${formatTaskForDisplay(event)}\n`;
    });
  }
  
  return summary.trim();
}
