
import { ShareTaskDialog } from "./ShareTaskDialog";
import { FormSubmitButton } from "./form/sections/FormSubmitButton";
import { TaskFormContent } from "./form/TaskFormContent";
import { useState } from "react";
import { Task, TaskPriority } from "./TaskBoard";
import { useChat } from "@/hooks/use-chat";
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotifications } from "@/hooks/use-notifications";
import { Subtask } from "./subtasks/SubtaskList";
import { useTaskAIResponse } from "@/hooks/use-task-ai-response";
import { detectPlatform } from "@/utils/notifications/platformDetection";

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
  const [fcmStatus, setFcmStatus] = useState<'loading' | 'ready' | 'error'>('ready');
  const { isSubscribed, isLoading: notificationsLoading, enableNotifications } = useNotifications();
  const platform = detectPlatform();
  const isIOSPWA = platform === 'ios-pwa';

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
        
        // Use the enableNotifications function from useNotifications hook
        // instead of the previous setupPushSubscription utility
        await enableNotifications();
        
        setFcmStatus('ready');
        onReminderEnabledChange(true);
        
        if (isIOSPWA) {
          toast({
            title: "Notifications Enabled",
            description: "iOS notifications will work best when the app is open",
          });
        } else {
          toast({
            title: "Success",
            description: "Notifications enabled successfully",
          });
        }
      } else {
        onReminderEnabledChange(false);
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
      setFcmStatus('error');
      onReminderEnabledChange(false);
      
      if (isIOSPWA) {
        toast({
          title: "Error",
          description: "iOS PWA notification setup failed. Please try again or check Settings.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : 'Failed to setup notifications. Please check browser permissions.',
          variant: "destructive",
        });
      }
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 overflow-y-auto scrollbar-hide">
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

      <div className="mt-6">
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
