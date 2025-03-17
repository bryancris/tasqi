
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { TaskFormState } from "./types";
import { Subtask } from "@/components/dashboard/subtasks/SubtaskList";

export function useTaskSubmission(
  taskId: number, 
  taskFormState: TaskFormState,
  subtasks: Subtask[],
  onSuccess: () => void
) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      let status: 'scheduled' | 'unscheduled' | 'event';
      
      if (taskFormState.isEvent) {
        status = 'event';
      } else if (taskFormState.isScheduled) {
        status = 'scheduled';
      } else {
        status = 'unscheduled';
      }
      
      // CRITICAL FIX: Log the exact reminder time value before saving 
      console.log(`⚡ SAVE TASK ${taskId}: Current reminderTime = ${taskFormState.reminderTime} (${typeof taskFormState.reminderTime})`);
      console.log(`⚡ SAVE TASK ${taskId}: Is exactly 0? ${taskFormState.reminderTime === 0 ? 'YES - AT START TIME' : 'NO'}`);
      
      // CRITICAL FIX: Ensure that explicit 0 is preserved in the database
      const finalReminderTime = taskFormState.reminderTime === 0 ? 0 : taskFormState.reminderTime;
      console.log(`⚡ SAVE TASK ${taskId}: Final reminderTime to save = ${finalReminderTime}`);
      
      const updateData = {
        title: taskFormState.title,
        description: taskFormState.description,
        status,
        date: (taskFormState.isScheduled || taskFormState.isEvent) && taskFormState.date ? taskFormState.date : null,
        priority: taskFormState.isEvent ? "medium" : taskFormState.priority,
        reminder_enabled: taskFormState.reminderEnabled,
        reminder_time: finalReminderTime, // Use the preserved value
        is_all_day: taskFormState.isEvent ? taskFormState.isAllDay : false
      } as const;
      
      if ((taskFormState.isScheduled || (taskFormState.isEvent && !taskFormState.isAllDay)) && taskFormState.startTime && taskFormState.startTime.trim() !== '') {
        Object.assign(updateData, {
          start_time: taskFormState.startTime
        });
      } else if (taskFormState.isEvent && taskFormState.isAllDay) {
        Object.assign(updateData, {
          start_time: null,
          end_time: null
        });
      }
      
      if ((taskFormState.isScheduled || (taskFormState.isEvent && !taskFormState.isAllDay)) && taskFormState.endTime && taskFormState.endTime.trim() !== '') {
        Object.assign(updateData, {
          end_time: taskFormState.endTime
        });
      }
      
      console.log(`⚡ SAVE TASK ${taskId}: Updating task with data:`, updateData);
      console.log(`⚡ SAVE TASK ${taskId}: Final reminder_time being sent:`, updateData.reminder_time, 
        "Type:", typeof updateData.reminder_time,
        "Is exactly 0?", updateData.reminder_time === 0 ? "YES - AT START TIME" : "NO");
      
      const { data, error: taskError } = await supabase.from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select();
        
      if (taskError) throw taskError;
      
      console.log(`⚡ SAVE TASK ${taskId}: Update success, returned data:`, data);

      await updateSubtasks(taskId, subtasks);

      // CRITICAL FIX: After successful update, verify the data in the database
      await verifyTaskUpdate(taskId);

      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      
      toast.success('Task updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubtasks = async (taskId: number, subtasks: Subtask[]) => {
    const existingSubtaskIds = subtasks.filter(st => st.id).map(st => st.id);
    
    if (existingSubtaskIds.length > 0) {
      const {
        error: deleteError
      } = await supabase.from('subtasks').delete().eq('task_id', taskId).not('id', 'in', `(${existingSubtaskIds.join(',')})`);
      if (deleteError) throw deleteError;
    }
    
    for (const subtask of subtasks) {
      const subtaskData = {
        task_id: taskId,
        title: subtask.title,
        status: subtask.status,
        position: subtask.position,
        notes: subtask.notes
      };
      if (subtask.id) {
        const {
          error: updateError
        } = await supabase.from('subtasks').update(subtaskData).eq('id', subtask.id);
        if (updateError) throw updateError;
      } else {
        const {
          error: createError
        } = await supabase.from('subtasks').insert(subtaskData);
        if (createError) throw createError;
      }
    }
  };

  const verifyTaskUpdate = async (taskId: number) => {
    const { data: verifyData, error: verifyError } = await supabase.from('tasks')
      .select('reminder_time, reminder_enabled')
      .eq('id', taskId)
      .single();
      
    if (!verifyError && verifyData) {
      console.log(`✅ VERIFY TASK ${taskId} AFTER SAVE:`, {
        saved_reminder_time: verifyData.reminder_time,
        saved_type: typeof verifyData.reminder_time,
        saved_reminder_enabled: verifyData.reminder_enabled,
        is_exactly_zero: verifyData.reminder_time === 0 ? "YES - AT START TIME" : "NO"
      });
    }
  };

  return {
    isLoading,
    handleSubmit
  };
}
