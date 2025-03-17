
import { useState, useEffect } from "react";
import { Task } from "@/components/dashboard/TaskBoard";
import { Subtask } from "@/components/dashboard/subtasks/SubtaskList";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useTaskStateInitialization(task: Task) {
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
      "Is exactly 0?", task.reminder_time === 0 ? 'YES' : 'NO');
    
    // Preserve raw value without conversion if it's explicitly 0
    if (task.reminder_time === 0) {
      console.log("👑 Task has explicit zero - preserving 0 (At start time)");
      return 0;
    } 
    
    // Handle string "0" the same as number 0
    if (task.reminder_time === "0") {
      console.log("👑 Task has string zero - converting to number 0 (At start time)");
      return 0;
    }
    
    // Handle null/undefined
    if (task.reminder_time === null || task.reminder_time === undefined) {
      console.log("👑 Task has null/undefined - defaulting to 15 minutes before");
      return 15;
    } 
    
    // For non-zero number values, use directly
    if (typeof task.reminder_time === 'number') {
      // Extra check for numerical 0 for extra safety
      if (task.reminder_time === 0) {
        console.log("👑 Task has numerical zero - preserving 0 (At start time)");
        return 0;
      }
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
    setSubtasks
  };
}
