
import { useState, useEffect } from "react";
import { Task } from "../TaskBoard";
import { Subtask } from "../subtasks/SubtaskList";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { normalizeReminderTime } from "@/utils/notifications/debug-utils";

export function useEditTaskState(task: Task, onClose: () => void) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [isScheduled, setIsScheduled] = useState(task.status === "scheduled");
  const [isEvent, setIsEvent] = useState(task.status === "event");
  const [isAllDay, setIsAllDay] = useState(task.is_all_day || false);
  const [date, setDate] = useState(task.date || "");
  const [startTime, setStartTime] = useState(task.start_time || "");
  const [endTime, setEndTime] = useState(task.end_time || "");
  const [priority, setPriority] = useState(task.priority || "low");
  
  const [reminderEnabled, setReminderEnabled] = useState(task.reminder_enabled || false);
  
  // CRITICAL FIX: More explicit handling for reminderTime to preserve 0 value
  const [reminderTime, setReminderTime] = useState<number>(() => {
    // CRITICAL FIX: Enhanced logging to debug the incoming value
    console.log(`🔍 Task "${task.title}" (id: ${task.id}) loaded with reminder_time:`, task.reminder_time, 
      "Type:", typeof task.reminder_time, 
      "Is exactly 0?", task.reminder_time === 0);
    
    // Special handling for explicit zero - "At start time"
    if (task.reminder_time === 0) {
      console.log("👑 Task has explicit zero - preserving 0 (At start time)");
      return 0;
    } 
    
    if (task.reminder_time === null || task.reminder_time === undefined) {
      console.log("👑 Task has null/undefined - defaulting to 15 minutes before");
      return 15;
    } 
    
    if (typeof task.reminder_time === 'number') {
      console.log(`👑 Using existing number value: ${task.reminder_time}`);
      return task.reminder_time;
    } 
    
    // If it's a string or any other type, try to convert safely
    try {
      const numValue = Number(task.reminder_time);
      console.log(`👑 Converting value to number: ${numValue}`);
      
      // Extra check to preserve 0 if it was "0"
      if (numValue === 0 || task.reminder_time === "0") {
        console.log("👑 Found 0 after conversion - preserving At start time");
        return 0;
      }
      
      return isNaN(numValue) ? 15 : numValue;
    } catch (err) {
      console.error("Error converting reminder_time:", err);
      return 15;
    }
  });
  
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadSubtasks();
    
    // CRITICAL FIX: Add additional debug logging for reminder time
    console.log("✅ Edit Task loaded with reminder_time:", task.reminder_time, "Type:", typeof task.reminder_time);
    console.log(`✅ Initialized reminderTime state for "${task.title}":`, reminderTime, "Type:", typeof reminderTime);
    console.log(`✅ Is "At start time"? ${reminderTime === 0 ? "YES" : "NO"}`);
    console.log(`✅ Is reminder enabled? ${reminderEnabled ? "YES" : "NO"}`);
  }, [task.id]);

  const loadSubtasks = async () => {
    if (!task.id) return;
    try {
      const {
        data,
        error
      } = await supabase.from('subtasks').select('id, title, status, position, notes').eq('task_id', task.id).order('position');
      if (error) {
        throw error;
      }
      if (data) {
        console.log('Loaded subtasks:', data);
        setSubtasks(data);
      }
    } catch (error) {
      console.error('Error loading subtasks:', error);
      toast.error('Failed to load subtasks');
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeletingTask(true);
      console.log("Deleting task with ID:", task.id);
      
      const {
        error
      } = await supabase.from('tasks').delete().eq('id', task.id);
      
      if (error) {
        console.error("Error from Supabase:", error);
        throw error;
      }
      
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      
      toast.success('Task deleted successfully');
      onClose();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    console.log("Date changed in EditTaskDrawer:", newDate);
    setDate(newDate);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      let status: 'scheduled' | 'unscheduled' | 'event';
      
      if (isEvent) {
        status = 'event';
      } else if (isScheduled) {
        status = 'scheduled';
      } else {
        status = 'unscheduled';
      }
      
      // CRITICAL FIX: Log the exact reminder time value before saving 
      console.log(`⚡ SAVE TASK ${task.id}: Current reminderTime = ${reminderTime} (${typeof reminderTime})`);
      console.log(`⚡ SAVE TASK ${task.id}: Is exactly 0? ${reminderTime === 0 ? 'YES - AT START TIME' : 'NO'}`);
      
      // CRITICAL FIX: Ensure that explicit 0 is preserved in the database
      const finalReminderTime = reminderTime === 0 ? 0 : reminderTime;
      console.log(`⚡ SAVE TASK ${task.id}: Final reminderTime to save = ${finalReminderTime}`);
      
      const updateData = {
        title,
        description,
        status,
        date: (isScheduled || isEvent) && date ? date : null,
        priority: isEvent ? "medium" : priority,
        reminder_enabled: reminderEnabled,
        reminder_time: finalReminderTime, // Use the preserved value
        is_all_day: isEvent ? isAllDay : false
      } as const;
      
      if ((isScheduled || (isEvent && !isAllDay)) && startTime && startTime.trim() !== '') {
        Object.assign(updateData, {
          start_time: startTime
        });
      } else if (isEvent && isAllDay) {
        Object.assign(updateData, {
          start_time: null,
          end_time: null
        });
      }
      
      if ((isScheduled || (isEvent && !isAllDay)) && endTime && endTime.trim() !== '') {
        Object.assign(updateData, {
          end_time: endTime
        });
      }
      
      console.log(`⚡ SAVE TASK ${task.id}: Updating task with data:`, updateData);
      console.log(`⚡ SAVE TASK ${task.id}: Final reminder_time being sent:`, updateData.reminder_time, 
        "Type:", typeof updateData.reminder_time,
        "Is exactly 0?", updateData.reminder_time === 0 ? "YES - AT START TIME" : "NO");
      
      const { data, error: taskError } = await supabase.from('tasks')
        .update(updateData)
        .eq('id', task.id)
        .select();
        
      if (taskError) throw taskError;
      
      console.log(`⚡ SAVE TASK ${task.id}: Update success, returned data:`, data);

      const existingSubtaskIds = subtasks.filter(st => st.id).map(st => st.id);
      if (existingSubtaskIds.length > 0) {
        const {
          error: deleteError
        } = await supabase.from('subtasks').delete().eq('task_id', task.id).not('id', 'in', `(${existingSubtaskIds.join(',')})`);
        if (deleteError) throw deleteError;
      }
      
      for (const subtask of subtasks) {
        const subtaskData = {
          task_id: task.id,
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

      // CRITICAL FIX: After successful update, verify the data in the database
      const { data: verifyData, error: verifyError } = await supabase.from('tasks')
        .select('reminder_time, reminder_enabled')
        .eq('id', task.id)
        .single();
        
      if (!verifyError && verifyData) {
        console.log(`✅ VERIFY TASK ${task.id} AFTER SAVE:`, {
          saved_reminder_time: verifyData.reminder_time,
          saved_type: typeof verifyData.reminder_time,
          saved_reminder_enabled: verifyData.reminder_enabled,
          is_exactly_zero: verifyData.reminder_time === 0 ? "YES - AT START TIME" : "NO"
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      
      toast.success('Task updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    title,
    description,
    isScheduled,
    isEvent,
    isAllDay,
    date,
    startTime,
    endTime,
    priority,
    reminderEnabled,
    reminderTime,
    subtasks,
    isLoading,
    isDeletingTask,
    showShareDialog,
    setTitle,
    setDescription,
    setIsScheduled,
    setIsEvent,
    setIsAllDay,
    setDate,
    setStartTime,
    setEndTime,
    setPriority,
    setReminderEnabled,
    setReminderTime,
    setSubtasks,
    setShowShareDialog,
    handleDateChange,
    handleSubmit,
    handleDelete
  };
}
