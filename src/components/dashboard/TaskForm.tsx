
import { Button } from "@/components/ui/button";
import { TaskPriority } from "./TaskBoard";
import { ShareTaskDialog } from "./ShareTaskDialog";
import { SubtaskList, Subtask } from "./subtasks/SubtaskList";
import { TaskScheduleFields } from "./TaskScheduleFields";
import { TaskBasicFields } from "./form/TaskBasicFields";
import { TaskNotificationFields } from "./form/TaskNotificationFields";
import { TaskAttachmentFields } from "./form/TaskAttachmentFields";
import { useState, useEffect } from "react";
import { Task } from "./TaskBoard";
import { useChat } from "@/hooks/use-chat";
import { toast } from "@/components/ui/use-toast";

interface TaskFormProps {
  title: string;
  description: string;
  isScheduled: boolean;
  date: string;
  startTime: string;
  endTime: string;
  priority: TaskPriority;
  reminderEnabled: boolean;
  subtasks: Subtask[];
  isLoading: boolean;
  isEditing?: boolean;
  task?: Task;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIsScheduledChange: (value: boolean) => void;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onPriorityChange: (value: TaskPriority) => void;
  onReminderEnabledChange: (value: boolean) => void;
  onSubtasksChange: (subtasks: Subtask[]) => void;
  onSubmit: () => void;
}

export function TaskForm({
  title,
  description,
  isScheduled,
  date,
  startTime,
  endTime,
  priority,
  reminderEnabled,
  subtasks,
  isLoading,
  isEditing = false,
  task,
  onTitleChange,
  onDescriptionChange,
  onIsScheduledChange,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onPriorityChange,
  onReminderEnabledChange,
  onSubtasksChange,
  onSubmit,
}: TaskFormProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { message, setMessage } = useChat();
  const [processingAIResponse, setProcessingAIResponse] = useState(false);

  useEffect(() => {
    const handleAIResponse = (e: CustomEvent<any>) => {
      console.log('AI Response received in TaskForm:', e.detail);
      
      if (e.detail?.task) {
        setProcessingAIResponse(true);
        
        try {
          const taskData = e.detail.task;
          console.log('Processing task data:', taskData);

          onTitleChange(taskData.title || '');
          onDescriptionChange(taskData.description || '');
          onIsScheduledChange(!!taskData.is_scheduled);
          if (taskData.date) onDateChange(taskData.date);

          if (taskData.subtasks && Array.isArray(taskData.subtasks)) {
            console.log('Setting subtasks:', taskData.subtasks);
            const newSubtasks = taskData.subtasks.map((subtask: any, index: number) => ({
              title: subtask.title,
              status: 'pending',
              position: index
            }));
            onSubtasksChange(newSubtasks);
            
            toast({
              title: "Subtasks Added",
              description: `Added ${newSubtasks.length} subtasks to your task.`,
            });
          }
        } catch (error) {
          console.error('Error processing AI response:', error);
          toast({
            title: "Error",
            description: "Failed to process AI response",
            variant: "destructive",
          });
        } finally {
          setProcessingAIResponse(false);
        }
      }
    };

    window.addEventListener('ai-response', handleAIResponse as EventListener);
    return () => window.removeEventListener('ai-response', handleAIResponse as EventListener);
  }, [onTitleChange, onDescriptionChange, onIsScheduledChange, onDateChange, onSubtasksChange]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="p-4 space-y-4"
    >
      <TaskBasicFields
        title={title}
        description={description}
        onTitleChange={onTitleChange}
        onDescriptionChange={onDescriptionChange}
      />

      <div className="space-y-2">
        <SubtaskList 
          subtasks={subtasks} 
          onSubtasksChange={onSubtasksChange}
        />
      </div>

      <TaskNotificationFields
        reminderEnabled={reminderEnabled}
        onReminderEnabledChange={onReminderEnabledChange}
      />

      <TaskScheduleFields
        isScheduled={isScheduled}
        date={date}
        startTime={startTime}
        endTime={endTime}
        priority={priority}
        onIsScheduledChange={onIsScheduledChange}
        onDateChange={onDateChange}
        onStartTimeChange={onStartTimeChange}
        onEndTimeChange={onEndTimeChange}
        onPriorityChange={onPriorityChange}
      />

      <TaskAttachmentFields task={task} isEditing={isEditing} />

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || processingAIResponse}
      >
        {isLoading || processingAIResponse ? "Loading..." : isEditing ? "Update Task" : "Create Task"}
      </Button>

      {task && (
        <ShareTaskDialog
          task={task}
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
        />
      )}
    </form>
  );
}
