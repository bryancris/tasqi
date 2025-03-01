
import { ShareTaskDialog } from "./ShareTaskDialog";
import { FormSubmitButton } from "./form/sections/FormSubmitButton";
import { TaskFormContent } from "./form/TaskFormContent";
import { useState } from "react";
import { Task, TaskPriority } from "./TaskBoard";
import { useChat } from "@/hooks/use-chat";
import { useIsMobile } from "@/hooks/use-mobile";
import { Subtask } from "./subtasks/SubtaskList";
import { useTaskAIResponse } from "@/hooks/use-task-ai-response";
import { useTaskFormState } from "@/hooks/use-task-form-state";

interface TaskFormProps {
  title: string;
  description: string;
  isScheduled: boolean;
  isEvent: boolean;
  isAllDay: boolean;
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
  onIsEventChange: (value: boolean) => void;
  onIsAllDayChange: (value: boolean) => void;
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
  isEvent,
  isAllDay,
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
  onIsEventChange,
  onIsAllDayChange,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onPriorityChange,
  onReminderEnabledChange,
  onReminderTimeChange,
  onSubtasksChange,
  onSubmit,
}: TaskFormProps) {
  const { message } = useChat();
  const isMobile = useIsMobile();
  
  const {
    showShareDialog,
    setShowShareDialog,
    fcmStatus,
    handleReminderToggle
  } = useTaskFormState({
    reminderEnabled,
    onReminderEnabledChange
  });

  const { processingAIResponse } = useTaskAIResponse({
    onTitleChange,
    onDescriptionChange,
    onIsScheduledChange,
    onDateChange,
    onSubtasksChange,
  });

  return (
    <TaskFormWrapper
      onSubmit={onSubmit}
      isLoading={isLoading}
      processingAIResponse={processingAIResponse}
      isEditing={isEditing}
      isMobile={isMobile}
    >
      <TaskFormContent
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
        fcmStatus={fcmStatus}
        isEditing={isEditing}
        task={task}
        onTitleChange={onTitleChange}
        onDescriptionChange={onDescriptionChange}
        onIsScheduledChange={onIsScheduledChange}
        onIsEventChange={onIsEventChange}
        onIsAllDayChange={onIsAllDayChange}
        onDateChange={onDateChange}
        onStartTimeChange={onStartTimeChange}
        onEndTimeChange={onEndTimeChange}
        onPriorityChange={onPriorityChange}
        onReminderEnabledChange={onReminderEnabledChange}
        onReminderTimeChange={onReminderTimeChange}
        onSubtasksChange={onSubtasksChange}
        handleReminderToggle={handleReminderToggle}
      />

      {task && (
        <ShareTaskDialog
          task={task}
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
        />
      )}
    </TaskFormWrapper>
  );
}

interface TaskFormWrapperProps {
  children: React.ReactNode;
  onSubmit: () => void;
  isLoading: boolean;
  processingAIResponse: boolean;
  isEditing: boolean;
  isMobile: boolean;
}

function TaskFormWrapper({ 
  children, 
  onSubmit, 
  isLoading, 
  processingAIResponse, 
  isEditing, 
  isMobile 
}: TaskFormWrapperProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {children}
      </div>

      <div className="mt-6">
        <FormSubmitButton 
          isLoading={isLoading}
          processingAIResponse={processingAIResponse}
          isEditing={isEditing}
          isMobile={isMobile}
        />
      </div>
    </form>
  );
}
