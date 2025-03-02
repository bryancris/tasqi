
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { extractDateFromMessage, formatDateForDB } from './dateUtils.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
const supabase = createClient(supabaseUrl, supabaseKey)

// Check if message is a task creation request
export function isTaskCreationRequest(message: string): boolean {
  const taskCreationPatterns = [
    /add (a )?task/i,
    /create (a )?task/i,
    /new task/i,
    /schedule (a )?task/i,
    /remind me to/i,
    /i need to/i,
    /set (a )?reminder/i,
    /add to( my)? to-?do( list)?/i
  ]
  
  return taskCreationPatterns.some(pattern => pattern.test(message))
}

// Check if message is asking about tasks
export function isTaskQueryRequest(message: string): boolean {
  const taskQueryPatterns = [
    /what (tasks|to-?dos) do i have/i,
    /show me my (tasks|to-?dos)/i,
    /list my (tasks|to-?dos)/i,
    /what('s| is) on my (schedule|to-?do list)/i,
    /do i have any (tasks|to-?dos)/i,
    /what am i (doing|supposed to do)/i
  ]
  
  return taskQueryPatterns.some(pattern => pattern.test(message))
}

// Get all tasks for a specific date
export async function getTasksForDate(userId: string, date: Date) {
  const formattedDate = formatDateForDB(date)
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('date', formattedDate)
    .order('start_time', { ascending: true })
  
  if (error) {
    console.error('Error fetching tasks:', error)
    throw error
  }
  
  return data || []
}

// Get unscheduled tasks
export async function getUnscheduledTasks(userId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'unscheduled')
    .order('position', { ascending: true })
  
  if (error) {
    console.error('Error fetching unscheduled tasks:', error)
    throw error
  }
  
  return data || []
}

// Get task count for a specific date
export async function getTaskCountForDate(userId: string, date: Date) {
  const formattedDate = formatDateForDB(date)
  
  const { data, error, count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('date', formattedDate)
  
  if (error) {
    console.error('Error counting tasks:', error)
    throw error
  }
  
  return count || 0
}

// Get count of unscheduled tasks
export async function getUnscheduledTaskCount(userId: string) {
  const { data, error, count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('status', 'unscheduled')
  
  if (error) {
    console.error('Error counting unscheduled tasks:', error)
    throw error
  }
  
  return count || 0
}

// Generate a summary of tasks for a given date
export function generateTaskSummary(tasks: any[], date: Date): string {
  if (tasks.length === 0) {
    return `You don't have any tasks scheduled for ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.`
  }
  
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  let summary = `Here are your tasks for ${dateStr}:\n\n`
  
  tasks.forEach((task, index) => {
    let taskTime = ''
    if (task.start_time) {
      taskTime = task.start_time.slice(0, 5)
      if (task.end_time) {
        taskTime += ` - ${task.end_time.slice(0, 5)}`
      }
      taskTime = ` at ${taskTime}`
    }
    
    summary += `${index + 1}. ${task.title}${taskTime}\n`
  })
  
  return summary
}

// Create a new task from the user's message
export async function createTaskFromMessage(message: string, userId: string) {
  try {
    // Extract potential date from message or default to today
    const extractedDate = extractDateFromMessage(message)
    const formattedDate = extractedDate ? formatDateForDB(extractedDate) : null
    
    // Determine if there's a date mentioned (scheduled) or not (unscheduled)
    const status = formattedDate ? 'scheduled' : 'unscheduled'
    
    // Get the highest position number for proper ordering
    const { data: positionData } = await supabase
      .from('tasks')
      .select('position')
      .eq('user_id', userId)
      .order('position', { ascending: false })
      .limit(1)
    
    const nextPosition = positionData && positionData.length > 0 
      ? (positionData[0].position + 1) 
      : 0
    
    // Create the new task
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: message,
        user_id: userId,
        date: formattedDate,
        status,
        position: nextPosition,
        priority: 'medium',
        owner_id: userId
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
