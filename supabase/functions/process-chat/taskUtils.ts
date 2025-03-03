
import type { TaskCommandResponse, Task } from "./types.ts";

/**
 * Check if a message contains task-related commands
 */
export async function checkForTaskCommands(
  message: string, 
  userId: string, 
  supabase: any
): Promise<TaskCommandResponse> {
  // This is a simple implementation to prevent errors
  // In a real app, this would have more sophisticated task command processing
  const lowerMessage = message.toLowerCase();
  
  // Check for task listing requests
  if (
    lowerMessage.includes("show my tasks") || 
    lowerMessage.includes("list my tasks") ||
    lowerMessage.includes("what are my tasks") ||
    lowerMessage.includes("show tasks")
  ) {
    console.log("Task listing request detected");
    
    try {
      const tasks = await fetchRecentTasks(supabase, userId);
      
      if (tasks.length === 0) {
        return {
          isTaskCommand: true,
          response: "You don't have any tasks scheduled. Would you like me to help you create some?"
        };
      }
      
      const todayTasks = tasks.filter(task => task.date && isToday(new Date(task.date)));
      
      if (todayTasks.length > 0) {
        const taskList = todayTasks.map(t => `- ${t.title}`).join('\n');
        return {
          isTaskCommand: true,
          response: `Here are your tasks for today:\n${taskList}`
        };
      } else {
        const taskList = tasks.slice(0, 5).map(t => `- ${t.title}`).join('\n');
        return {
          isTaskCommand: true,
          response: `You don't have any tasks for today. Here are your recent tasks:\n${taskList}`
        };
      }
    } catch (error) {
      console.error("Error processing task listing:", error);
      return {
        isTaskCommand: true,
        response: "I had trouble retrieving your tasks. Please try again later."
      };
    }
  }
  
  // Not a task command
  return {
    isTaskCommand: false,
    response: ""
  };
}

/**
 * Extract task details from AI response
 */
export function extractTaskDetails(aiResponse: string): Task | null {
  // For now, return null since AI responses don't automatically create tasks
  // This could be enhanced with NLP to extract potential task details
  return null;
}

/**
 * Helper to check if a date is today
 */
function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

/**
 * Fetch recent tasks for a user
 */
export async function fetchRecentTasks(supabase: any, userId: string): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, description, date, status, priority')
      .eq('user_id', userId)
      .order('date', { ascending: true })
      .limit(10);
      
    if (error) {
      console.error("Error fetching tasks:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Exception fetching tasks:", error);
    return [];
  }
}
