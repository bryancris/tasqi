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
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { setupPushSubscription } from "@/utils/notifications/subscriptionUtils";
import { checkNotificationPermission } from "@/utils/notifications/notificationUtils";

interface TaskFormProps {
  title: string;
  description: string;
  isScheduled: boolean;
  date: string;
  startTime: string;
  endTime: string;
  priority: TaskPriority;
  reminderEnabled: boolean;
  reminderTime: number;
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
  onReminderTimeChange: (value: number) => void;
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
  reminderTime,
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
  onReminderTimeChange,
  onSubtasksChange,
  onSubmit,
}: TaskFormProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { message, setMessage } = useChat();
  const [processingAIResponse, setProcessingAIResponse] = useState(false);
  const isMobile = useIsMobile();

  const handleReminderToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        const hasPermission = await checkNotificationPermission();
        if (!hasPermission) {
          throw new Error("Notification permission denied");
        }
        await setupPushSubscription();
      }
      onReminderEnabledChange(enabled);
    } catch (error) {
      console.error('Error setting up notifications:', error);
      toast("Failed to set up notifications. Please check browser permissions.");
      onReminderEnabledChange(false);
    }
  };

  const handleIsScheduledChange = (value: boolean) => {
    if (!value && reminderEnabled) {
      toast("Notifications disabled as task is no longer scheduled");
      onReminderEnabledChange(false);
    }
    onIsScheduledChange(value);
  };

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
            
            toast(`Added ${newSubtasks.length} subtasks to your task.`);
          }
        } catch (error) {
          console.error('Error processing AI response:', error);
          toast("Failed to process AI response");
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
      className="flex flex-col h-full"
    >
      <div className="flex-1 overflow-y-auto">
        <div className={`p-4 space-y-4 ${isMobile ? 'pb-28' : ''}`}>
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

          <TaskScheduleFields
            isScheduled={isScheduled}
            date={date}
            startTime={startTime}
            endTime={endTime}
            priority={priority}
            onIsScheduledChange={handleIsScheduledChange}
            onDateChange={onDateChange}
            onStartTimeChange={onStartTimeChange}
            onEndTimeChange={onEndTimeChange}
            onPriorityChange={onPriorityChange}
          />

          <TaskNotificationFields
            reminderEnabled={reminderEnabled}
            reminderTime={reminderTime}
            isScheduled={isScheduled}
            onReminderEnabledChange={handleReminderToggle}
            onReminderTimeChange={onReminderTimeChange}
            onIsScheduledChange={onIsScheduledChange}
          />

          <TaskAttachmentFields task={task} isEditing={isEditing} />
        </div>
      </div>

      <div className={`${isMobile ? 'sticky bottom-0 left-0 right-0 p-4 bg-white border-t z-50' : 'p-4'}`}>
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || processingAIResponse}
        >
          {isLoading || processingAIResponse ? "Loading..." : isEditing ? "Update Task" : "Create Task"}
        </Button>
      </div>

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
