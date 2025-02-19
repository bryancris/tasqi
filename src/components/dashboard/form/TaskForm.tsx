
import { ShareTaskDialog } from "../ShareTaskDialog";
import { SubtaskList, Subtask } from "../subtasks/SubtaskList";
import { TaskScheduleFields } from "../TaskScheduleFields";
import { TaskBasicFields } from "./TaskBasicFields";
import { TaskNotificationFields } from "./TaskNotificationFields";
import { TaskAttachmentFields } from "./TaskAttachmentFields";
import { useState, useEffect } from "react";
import { Task, TaskPriority } from "../TaskBoard";
import { useChat } from "@/hooks/use-chat";
import { useIsMobile } from "@/hooks/use-mobile";
import { handleAIResponse } from "./utils/handleAIResponse";
import { useNotificationHandler } from "./components/NotificationHandler";
import { TaskFormFooter } from "./components/TaskFormFooter";

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
  const [processingAIResponse, setProcessingAIResponse] = useState(false);
  const isMobile = useIsMobile();
  const { message, setMessage } = useChat();

  const { handleReminderToggle, handleIsScheduledChange } = useNotificationHandler({
    reminderEnabled,
    onReminderEnabledChange,
    onIsScheduledChange,
  });

  useEffect(() => {
    const handleAIResponseEvent = (e: CustomEvent<any>) => {
      setProcessingAIResponse(true);
      try {
        handleAIResponse(e, {
          onTitleChange,
          onDescriptionChange,
          onIsScheduledChange,
          onDateChange,
          onSubtasksChange,
        });
      } finally {
        setProcessingAIResponse(false);
      }
    };

    window.addEventListener('ai-response', handleAIResponseEvent as EventListener);
    return () => window.removeEventListener('ai-response', handleAIResponseEvent as EventListener);
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

      <TaskFormFooter
        isLoading={isLoading}
        processingAIResponse={processingAIResponse}
        isEditing={isEditing}
        isMobile={isMobile}
      />

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
