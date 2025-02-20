
import { useState } from "react";
import { useFCMStatus } from "./use-fcm-status";
import { useChat } from "./use-chat";
import { useIsMobile } from "./use-mobile";
import { useAiTaskResponse } from "./use-ai-task-response";
import { Task, TaskPriority } from "@/components/dashboard/TaskBoard";
import { Subtask } from "@/components/dashboard/subtasks/SubtaskList";

interface UseTaskFormProps {
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
}

export function useTaskForm({
  onTitleChange,
  onDescriptionChange,
  onIsScheduledChange,
  onDateChange,
  onSubtasksChange,
}: UseTaskFormProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { message, setMessage } = useChat();
  const isMobile = useIsMobile();
  const { fcmStatus, handleReminderToggle } = useFCMStatus();
  const { processingAIResponse } = useAiTaskResponse({
    onTitleChange,
    onDescriptionChange,
    onIsScheduledChange,
    onDateChange,
    onSubtasksChange,
  });

  return {
    showShareDialog,
    setShowShareDialog,
    message,
    setMessage,
    isMobile,
    fcmStatus,
    handleReminderToggle,
    processingAIResponse,
  };
}
