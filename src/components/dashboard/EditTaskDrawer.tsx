
import { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Task } from "./TaskBoard";
import { TaskForm } from "./TaskForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Subtask } from "./subtasks/SubtaskList";

interface EditTaskDrawerProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDrawer({ task, open, onOpenChange }: EditTaskDrawerProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [isScheduled, setIsScheduled] = useState(task.status === "scheduled");
  const [date, setDate] = useState(task.date || "");
  const [startTime, setStartTime] = useState(task.start_time || "");
  const [endTime, setEndTime] = useState(task.end_time || "");
  const [priority, setPriority] = useState(task.priority || "low");
  const [reminderEnabled, setReminderEnabled] = useState(task.reminder_enabled || false);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSubtasks();
  }, [task.id]);

  const loadSubtasks = async () => {
    try {
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', task.id)
        .order('position');

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

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Update main task
      const { error: taskError } = await supabase
        .from('tasks')
        .update({
          title,
          description,
          status: isScheduled ? 'scheduled' : 'unscheduled',
          date: isScheduled ? date : null,
          start_time: isScheduled ? startTime : null,
          end_time: isScheduled ? endTime : null,
          priority,
          reminder_enabled: reminderEnabled,
        })
        .eq('id', task.id);

      if (taskError) throw taskError;

      // Update subtasks
      for (const subtask of subtasks) {
        if (subtask.id) {
          // Update existing subtask
          const { error: subtaskError } = await supabase
            .from('subtasks')
            .update({
              title: subtask.title,
              status: subtask.status,
              position: subtask.position,
            })
            .eq('id', subtask.id);

          if (subtaskError) throw subtaskError;
        } else {
          // Create new subtask
          const { error: newSubtaskError } = await supabase
            .from('subtasks')
            .insert({
              task_id: task.id,
              title: subtask.title,
              status: subtask.status,
              position: subtask.position,
            });

          if (newSubtaskError) throw newSubtaskError;
        }
      }

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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="max-w-xl mx-auto w-full">
          <DrawerHeader className="sticky top-0 bg-background z-10 pb-4">
            <DrawerTitle>Edit Task</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 max-h-[calc(85vh-80px)] overflow-y-auto">
            <TaskForm
              title={title}
              description={description}
              isScheduled={isScheduled}
              date={date}
              startTime={startTime}
              endTime={endTime}
              priority={task.priority || "low"}
              reminderEnabled={reminderEnabled}
              subtasks={subtasks}
              isLoading={isLoading}
              isEditing={true}
              task={task}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
              onIsScheduledChange={setIsScheduled}
              onDateChange={setDate}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
              onPriorityChange={setPriority}
              onReminderEnabledChange={setReminderEnabled}
              onSubtasksChange={setSubtasks}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
