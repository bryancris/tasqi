
import { ShareTaskDialog } from "./ShareTaskDialog";
import { FormSubmitButton } from "./form/sections/FormSubmitButton";
import { TaskFormContent } from "./form/TaskFormContent";
import { useState } from "react";
import { Task, TaskPriority } from "./TaskBoard";
import { useChat } from "@/hooks/use-chat";
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { setupPushSubscription } from "@/utils/notifications/subscriptionUtils";
import { Subtask } from "./subtasks/SubtaskList";
import { useTaskAIResponse } from "@/hooks/use-task-ai-response";

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
  const isMobile = useIsMobile();
  const [fcmStatus, setFcmStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const { processingAIResponse } = useTaskAIResponse({
    onTitleChange,
    onDescriptionChange,
    onIsScheduledChange,
    onDateChange,
    onSubtasksChange,
  });

  const handleReminderToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        setFcmStatus('loading');
        await setupPushSubscription();
        setFcmStatus('ready');
      }
      onReminderEnabledChange(enabled);
    } catch (error) {
      console.error('Error setting up notifications:', error);
      setFcmStatus('error');
      toast({
        title: "Error",
        description: "Failed to set up notifications. Please check browser permissions.",
        variant: "destructive",
      });
      onReminderEnabledChange(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="h-full flex flex-col"
    >
      <div className="flex-1 overflow-y-auto">
        <TaskFormContent
          title={title}
          description={description}
          isScheduled={isScheduled}
          date={date}
          startTime={startTime}
          endTime={endTime}
          priority={priority}
          reminderEnabled={reminderEnabled}
          reminderTime={reminderTime}
          subtasks={subtasks}
          fcmStatus={fcmStatus}
          isEditing={isEditing}
          task={task}
          onTitleChange={onTitleChange}
          onDescriptionChange={onDescriptionChange}
          onIsScheduledChange={onIsScheduledChange}
          onDateChange={onDateChange}
          onStartTimeChange={onStartTimeChange}
          onEndTimeChange={onEndTimeChange}
          onPriorityChange={onPriorityChange}
          onReminderEnabledChange={onReminderEnabledChange}
          onReminderTimeChange={onReminderTimeChange}
          onSubtasksChange={onSubtasksChange}
          handleReminderToggle={handleReminderToggle}
        />
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-auto">
        <FormSubmitButton 
          isLoading={isLoading}
          processingAIResponse={processingAIResponse}
          isEditing={isEditing}
          isMobile={isMobile}
        />
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
