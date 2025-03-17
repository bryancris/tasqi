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
    
    // FIXED: Enhanced handling for reminderTime to ensure "At start time" (0) is preserved
    // First preserve the original value
    const originalReminderTime = formState.reminderTime;
    console.log('🚨 Task data preparation - original reminderTime:', originalReminderTime);
    console.log('🚨 ReminderTime type:', typeof originalReminderTime);
    console.log('🚨 Is exactly zero?', originalReminderTime === 0);
    
    // If it's explicitly 0, keep it as 0 without any normalization
    let reminderTime;
    if (originalReminderTime === 0) {
      reminderTime = 0; // Preserve exact 0 for "At start time"
      console.log('🚨 Preserving exact 0 for "At start time"');
    } else {
      // For other values, normalize
      reminderTime = normalizeReminderTime(originalReminderTime);
      console.log('🚨 After normalization, reminderTime =', reminderTime);
    }
    
    console.log('🚨 Final reminderTime =', reminderTime);
    console.log('🚨 Is At start time?', reminderTime === 0 ? 'YES' : 'NO');

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
      reminder_time: reminderTime, // Using the strictly preserved value
      is_all_day: formState.isAllDay
    };
    
    console.log('🚨 Final task data to be saved to database:', taskData);
    console.log('🚨 Final reminder_time value:', taskData.reminder_time, 'Type:', typeof taskData.reminder_time);
    console.log('🚨 Is "At start time"?', taskData.reminder_time === 0 ? 'YES' : 'NO');

    return { taskData, nextPosition };
  };

  return { prepareTaskData };
}
