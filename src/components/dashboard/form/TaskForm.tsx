
import { Task, TaskPriority } from "../TaskBoard";
import { ShareTaskDialog } from "../ShareTaskDialog";
import { Subtask } from "../subtasks/SubtaskList";
import { TaskFormContent } from "./task-form/TaskFormContent";
import { TaskFormFooter } from "./TaskFormFooter";
import { useTaskForm } from "@/hooks/use-task-form";

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
  const {
    showShareDialog,
    setShowShareDialog,
    isMobile,
    fcmStatus,
    handleReminderToggle,
    processingAIResponse,
  } = useTaskForm({
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
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col h-full relative bg-gradient-to-br from-[#F1F0FB] to-[#E5DEFF] overflow-hidden"
    >
      <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
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
          task={task}
          isEditing={isEditing}
          isMobile={isMobile}
          fcmStatus={fcmStatus}
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

      <div className="absolute bottom-0 left-0 right-0">
        <TaskFormFooter
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
