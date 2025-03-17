
import { TaskPriority } from "@/components/dashboard/TaskBoard";
import { Subtask } from "@/components/dashboard/subtasks/SubtaskList";
import { supabase } from "@/integrations/supabase/client";

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
  subtasks: Subtask[];
}

export function useTaskDataPreparation() {
  const prepareTaskData = async (formState: TaskFormState, userId: string) => {
    // Fetch the user's highest position task to determine the new position
    const { data: existingTasks } = await supabase
      .from("tasks")
      .select("position")
      .eq("user_id", userId)
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition = existingTasks && existingTasks.length > 0
      ? Math.ceil(existingTasks[0].position / 1000) * 1000 + 1000
      : 1000;

    // Determine the task status
    let status;
    if (formState.isEvent) {
      status = "event";
    } else if (formState.isScheduled) {
      status = "scheduled";
    } else {
      status = "unscheduled";
    }

    // Determine time fields based on task type and all-day setting
    const date = (formState.isScheduled || formState.isEvent) ? formState.date : null;
    const taskStartTime = formState.isAllDay ? null : formState.startTime;
    const taskEndTime = formState.isAllDay ? null : formState.endTime;
    
    // CRITICAL FIX: Enhanced debugging and strict type handling for reminderTime
    console.log('🎯 Task form state reminderTime:', formState.reminderTime, 'Type:', typeof formState.reminderTime);
    
    // CRITICAL FIX: Explicit handling for reminder_time to ensure 0 is correctly preserved
    let reminderTime: number = 0;
    
    if (formState.reminderEnabled) {
      if (formState.reminderTime === 0) {
        // Explicitly handle 0 case to prevent type coercion issues
        reminderTime = 0;
        console.log('✨ Explicit zero detected - preserving "At start time" value');
      } else if (formState.reminderTime) {
        reminderTime = Number(formState.reminderTime);
        console.log(`✨ Using numeric value: ${reminderTime}`);
      } else {
        reminderTime = 0;
        console.log('✨ No valid value found - defaulting to 0 (At start time)');
      }
    }
      
    console.log('✨ Final reminder time to be saved:', reminderTime, 'Type:', typeof reminderTime);

    const taskData = {
      title: formState.title,
      description: formState.description,
      date,
      status,
      start_time: taskStartTime,
      end_time: taskEndTime,
      priority: formState.priority,
      position: nextPosition,
      user_id: userId,
      owner_id: userId,
      shared: false,
      reminder_enabled: formState.reminderEnabled,
      reminder_time: reminderTime, // Using the strictly processed value
      is_all_day: formState.isAllDay
    };
    
    console.log('Final task data to be saved to database:', taskData);

    return { taskData, nextPosition };
  };

  return { prepareTaskData };
}
