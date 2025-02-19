
import { TaskPriority } from "../TaskBoard";
import { ShareTaskDialog } from "../ShareTaskDialog";
import { SubtaskList, Subtask } from "../subtasks/SubtaskList";
import { TaskScheduleFields } from "../TaskScheduleFields";
import { TaskBasicFields } from "./TaskBasicFields";
import { TaskNotificationFields } from "./TaskNotificationFields";
import { TaskAttachmentFields } from "./TaskAttachmentFields";
import { TaskFormFooter } from "./TaskFormFooter";
import { useState } from "react";
import { Task } from "../TaskBoard";
import { useChat } from "@/hooks/use-chat";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFcmStatus } from "@/hooks/use-fcm-status";
import { useAiTaskResponse } from "@/hooks/use-ai-task-response";

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
  
  const { fcmStatus, handleReminderToggle } = useFcmStatus();
  const { processingAIResponse } = useAiTaskResponse({
    onTitleChange,
    onDescriptionChange,
    onIsScheduledChange,
    onDateChange,
    onSubtasksChange,
  });

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

          <TaskNotificationFields
            reminderEnabled={reminderEnabled}
            reminderTime={reminderTime}
            fcmStatus={fcmStatus}
            onReminderEnabledChange={(enabled) => handleReminderToggle(enabled, onReminderEnabledChange)}
            onReminderTimeChange={onReminderTimeChange}
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
