
import { supabase } from "@/integrations/supabase/client";
import { TaskPriority } from "@/components/dashboard/TaskBoard";

interface TaskFormState {
  title: string;
  description: string;
  isScheduled: boolean;
  isEvent: boolean;
  isAllDay: boolean;
  date: string;
  startTime: string;
  endTime: string;
  priority: TaskPriority;
  reminderEnabled: boolean;
  reminderTime: number;
}

// Define the return type from prepareTaskData to match what's expected in useTaskDatabaseOperations
interface PreparedTaskData {
  taskData: {
    title: string;
    description: string;
    status: 'scheduled' | 'unscheduled' | 'event';
    date: string | null;
    start_time: string | null;
    end_time: string | null;
    priority: string;
    reminder_enabled: boolean;
    reminder_time: number;
    user_id: string;
    owner_id: string;
    is_all_day: boolean;
    position: number;
    assignees: string[];
    shared: boolean;
    is_tracking: boolean;
    reschedule_count: number;
  };
  status: 'scheduled' | 'unscheduled' | 'event';
  finalEndTime: string;
}

export function useTaskDataPreparation() {
  // Prepare the task data for submission
  const prepareTaskData = async (formState: TaskFormState, userId: string): Promise<PreparedTaskData> => {
    console.log("Preparing task data for:", formState.title);
    
    // Calculate end time if only start time is provided
    let finalEndTime = formState.endTime;
    if ((formState.isScheduled || (formState.isEvent && !formState.isAllDay)) && 
        formState.startTime && !formState.endTime) {
      console.log("Missing end time when start time is set, using default end time");
      const [hours, minutes] = formState.startTime.split(':').map(Number);
      const endHours = (hours + 1) % 24;
      finalEndTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }

    // Determine the task status
    let status: 'scheduled' | 'unscheduled' | 'event';
    if (formState.isEvent) {
      status = 'event';
    } else if (formState.isScheduled) {
      status = 'scheduled';
    } else {
      status = 'unscheduled';
    }
    
    // Handle reminder time value
    let reminderTimeValue: number;
    if (formState.reminderTime === 0) {
      reminderTimeValue = 0;
      console.log("⚠️ Setting reminder_time to EXACTLY 0 (At start time)");
    } else if (formState.reminderTime) {
      reminderTimeValue = Number(formState.reminderTime);
      console.log(`⚠️ Setting reminder_time to ${reminderTimeValue} minutes before`);
    } else {
      reminderTimeValue = 0; // Default to "At start time" instead of 15
      console.log("⚠️ reminder_time was undefined, defaulting to 0 (At start time)");
    }
    
    console.log(`💡 Final reminder time value for database: ${reminderTimeValue} (type: ${typeof reminderTimeValue})`);

    // Get position for the new task
    const { data: existingTasks, error: countError } = await supabase
      .from("tasks")
      .select("position")
      .order("position", { ascending: false })
      .limit(1);

    let position = 0;
    if (countError) {
      console.error("Error fetching task positions:", countError);
    } else {
      console.log("Existing tasks result:", existingTasks);
      if (existingTasks && existingTasks.length > 0) {
        position = existingTasks[0].position + 1;
        console.log("Set position to:", position);
      } else {
        console.log("No existing tasks found, keeping position at 0");
      }
    }

    // Build the final task data object
    const taskData = {
      title: formState.title,
      description: formState.description,
      status,
      date: (formState.isScheduled || formState.isEvent) && formState.date ? formState.date : null,
      start_time: (formState.isScheduled || (formState.isEvent && !formState.isAllDay)) && formState.startTime ? formState.startTime : null,
      end_time: (formState.isScheduled || (formState.isEvent && !formState.isAllDay)) && finalEndTime ? finalEndTime : null,
      priority: formState.isEvent ? "medium" : formState.priority,
      reminder_enabled: formState.reminderEnabled,
      reminder_time: reminderTimeValue,
      user_id: userId,
      owner_id: userId,
      is_all_day: formState.isEvent ? formState.isAllDay : false,
      position,
      assignees: [],
      shared: false,
      is_tracking: false,
      reschedule_count: 0
    };

    return {
      taskData,
      status,
      finalEndTime
    };
  };

  return { prepareTaskData };
}
