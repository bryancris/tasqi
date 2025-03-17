import { TaskPriority } from "@/components/dashboard/TaskBoard";
import { Subtask } from "@/components/dashboard/subtasks/SubtaskList";
import { supabase } from "@/integrations/supabase/client";
import { normalizeReminderTime } from "@/utils/notifications/debug-utils";

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
  const prepareTaskData = async (formState: TaskFormState, userId: string, isAtStartTime = false) => {
    console.log('🔴 prepareTaskData called with reminderTime:', formState.reminderTime, 
      'Type:', typeof formState.reminderTime, 
      'Is zero?', formState.reminderTime === 0 ? 'YES' : 'NO',
      'isAtStartTime flag:', isAtStartTime);
    
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
    
    // CRITICAL FIX: Special handling for reminderTime=0 ("At start time")
    // If isAtStartTime flag is set or reminderTime is exactly 0, ensure we keep it as 0
    let reminderTime = formState.reminderTime;
    
    // CRITICAL FIX: Force to exactly number 0 for "At start time"
    if (isAtStartTime || formState.reminderTime === 0) {
      reminderTime = 0;
      console.log('🔴 CRITICAL: Forcing exact number 0 for "At start time" in data preparation');
    } else if (typeof formState.reminderTime === 'string' && formState.reminderTime === "0") {
      // Handle string "0" case
      reminderTime = 0;
      console.log('🔴 CRITICAL: Converting string "0" to exact number 0 in data preparation');
    } else {
      // For non-zero values, normalize
      reminderTime = normalizeReminderTime(formState.reminderTime);
      console.log('🔴 Normalized non-zero reminderTime from', formState.reminderTime, 'to', reminderTime);
    }
    
    console.log('🔴 Final reminderTime value for database:', reminderTime);
    console.log('🔴 Final reminderTime type:', typeof reminderTime);
    console.log('🔴 Is "At start time"?', reminderTime === 0 ? 'YES' : 'NO');

    // CRITICAL FIX: Force the type to be number
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
      reminder_time: Number(reminderTime), // Explicitly convert to number
      is_all_day: formState.isAllDay
    };
    
    // Extra verification step for "At start time"
    if (isAtStartTime || formState.reminderTime === 0 || (typeof formState.reminderTime === 'string' && formState.reminderTime === "0")) {
      // Double-check and force number 0 for absolute certainty
      taskData.reminder_time = 0;
      console.log('🔴 FINAL VERIFICATION: Forced reminder_time to exactly number 0 for database insertion');
    }
    
    console.log('🔴 Final task data prepared:', taskData);
    console.log('🔴 Final reminder_time value:', taskData.reminder_time, 'Type:', typeof taskData.reminder_time);
    console.log('🔴 Is "At start time"?', taskData.reminder_time === 0 ? 'YES' : 'NO');

    return { taskData, nextPosition };
  };

  return { prepareTaskData };
}
