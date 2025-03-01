
import { useState, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Task } from "./TaskBoard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Subtask } from "./subtasks/SubtaskList";
import { ShareTaskDialog } from "./ShareTaskDialog";
import { EditTaskHeader } from "./edit-task/EditTaskHeader";
import { EditTaskContent } from "./edit-task/EditTaskContent";
import { useQueryClient } from "@tanstack/react-query";

interface EditTaskDrawerProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDrawer({
  task,
  open,
  onOpenChange
}: EditTaskDrawerProps) {
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
  const [reminderTime, setReminderTime] = useState(task.reminder_time || 15);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadSubtasks();
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
      const {
        error
      } = await supabase.from('tasks').delete().eq('id', task.id);
      if (error) throw error;
      toast.success('Task deleted successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
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
      
      const updateData = {
        title,
        description,
        status,
        date: (isScheduled || isEvent) && date ? date : null,
        priority,
        reminder_enabled: reminderEnabled,
        reminder_time: reminderTime,
        is_all_day: isEvent ? isAllDay : false
      } as const;
      
      // Only include time fields if not all-day event
      if ((isScheduled || (isEvent && !isAllDay)) && startTime && startTime.trim() !== '') {
        Object.assign(updateData, {
          start_time: startTime
        });
      } else if (isEvent && isAllDay) {
        // Clear time fields for all-day events
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

      // Immediately invalidate and refetch tasks
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      
      toast.success('Task updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="left" 
          className="w-[400px] sm:max-w-[540px]"
          onOpenAutoFocus={e => e.preventDefault()}
          onPointerDownOutside={e => e.preventDefault()}
        >
          <EditTaskHeader onShareClick={() => setShowShareDialog(true)} />
          <EditTaskContent
            task={task}
            title={title}
            description={description}
            isScheduled={isScheduled}
            isEvent={isEvent}
            isAllDay={isAllDay}
            date={date}
            startTime={startTime}
            endTime={endTime}
            priority={priority}
            reminderEnabled={reminderEnabled}
            reminderTime={reminderTime}
            subtasks={subtasks}
            isLoading={isLoading}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onIsScheduledChange={setIsScheduled}
            onIsEventChange={setIsEvent}
            onIsAllDayChange={setIsAllDay}
            onDateChange={handleDateChange}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
            onPriorityChange={setPriority}
            onReminderEnabledChange={setReminderEnabled}
            onReminderTimeChange={setReminderTime}
            onSubtasksChange={setSubtasks}
            onSubmit={handleSubmit}
            onDelete={handleDelete}
          />
        </SheetContent>
      </Sheet>
      <ShareTaskDialog
        task={task}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
    </>
  );
}
