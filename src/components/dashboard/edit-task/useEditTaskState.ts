
import { useState, useEffect } from "react";
import { Task } from "../TaskBoard";
import { Subtask } from "../subtasks/SubtaskList";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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
  
  // Fix: Convert string or potentially string values to number for consistent type
  const [reminderEnabled, setReminderEnabled] = useState(task.reminder_enabled || false);
  const [reminderTime, setReminderTime] = useState(
    task.reminder_time === 0 ? 0 : 
    task.reminder_time === null ? 0 :
    typeof task.reminder_time === 'string' ? Number(task.reminder_time) : 
    typeof task.reminder_time === 'number' ? task.reminder_time : 
    0
  );
  
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadSubtasks();
    
    console.log("Loaded task with reminder_time:", task.reminder_time, "Type:", typeof task.reminder_time);
    console.log(`Task "${task.title}" loaded with reminderTime state:`, reminderTime);
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
      
      let reminderTimeValue: number;
      
      // Fix: Use strict number comparison with proper type conversion
      if (reminderTime === 0) {
        reminderTimeValue = 0;
        console.log("⚠️ Setting reminder_time to EXACTLY 0 (At start time)");
      } else if (reminderTime) {
        reminderTimeValue = Number(reminderTime);
        console.log(`⚠️ Setting reminder_time to ${reminderTimeValue} minutes before`);
      } else {
        reminderTimeValue = 0;
        console.log("⚠️ reminderTime was undefined, defaulting to 0 (At start time)");
      }
      
      console.log(`Submitting task update with reminder_time: ${reminderTimeValue} (${typeof reminderTimeValue})`);
      
      const updateData = {
        title,
        description,
        status,
        date: (isScheduled || isEvent) && date ? date : null,
        priority: isEvent ? "medium" : priority,
        reminder_enabled: reminderEnabled,
        reminder_time: reminderTimeValue,
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
      
      console.log("Updating task with data:", updateData);
      const {
        error: taskError
      } = await supabase.from('tasks').update(updateData).eq('id', task.id);
      if (taskError) throw taskError;

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
