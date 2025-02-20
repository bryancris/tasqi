import { ShareTaskDialog } from "./ShareTaskDialog";
import { TaskScheduleFields } from "./TaskScheduleFields";
import { TaskBasicFields } from "./form/TaskBasicFields";
import { TaskNotificationFields } from "./form/TaskNotificationFields";
import { TaskAttachmentFields } from "./form/TaskAttachmentFields";
import { FormSection } from "./form/sections/FormSection";
import { FormSubmitButton } from "./form/sections/FormSubmitButton";
import { SubtasksSection } from "./form/sections/SubtasksSection";
import { useState, useEffect } from "react";
import { Task, TaskPriority } from "./TaskBoard";
import { useChat } from "@/hooks/use-chat";
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { setupPushSubscription } from "@/utils/notifications/subscriptionUtils";
import { Subtask } from "./subtasks/SubtaskList";

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
  const [fcmStatus, setFcmStatus] = useState<'loading' | 'ready' | 'error'>('loading');

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

  useEffect(() => {
    const checkInitialFcmStatus = async () => {
      try {
        setFcmStatus('loading');
        await setupPushSubscription();
        setFcmStatus('ready');
      } catch (error) {
        console.error('Error checking FCM status:', error);
        setFcmStatus('error');
      }
    };

    checkInitialFcmStatus();
  }, []);

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
      className="h-full flex flex-col"
    >
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full bg-gradient-to-br from-[#F1F0FB] to-[#E5DEFF] p-4 space-y-6 pb-24">
          <FormSection>
            <TaskBasicFields
              title={title}
              description={description}
              onTitleChange={onTitleChange}
              onDescriptionChange={onDescriptionChange}
            />
          </FormSection>

          <SubtasksSection 
            subtasks={subtasks}
            onSubtasksChange={onSubtasksChange}
          />

          <FormSection>
            <TaskNotificationFields
              reminderEnabled={reminderEnabled}
              reminderTime={reminderTime}
              fcmStatus={fcmStatus}
              onReminderEnabledChange={handleReminderToggle}
              onReminderTimeChange={onReminderTimeChange}
            />
          </FormSection>

          <FormSection>
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
          </FormSection>

          <FormSection>
            <TaskAttachmentFields task={task} isEditing={isEditing} />
          </FormSection>
        </div>
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
