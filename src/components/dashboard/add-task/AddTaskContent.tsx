
import { TaskForm } from "../TaskForm";
import { Task, TaskPriority } from "../TaskBoard";
import { Subtask } from "../subtasks/SubtaskList";
import { useIsMobile } from "@/hooks/use-mobile";

interface AddTaskContentProps {
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

export function AddTaskContent({
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
}: AddTaskContentProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gradient-to-b from-purple-50/50 to-white">
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
        <TaskForm
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
          isLoading={isLoading}
          onTitleChange={onTitleChange}
          onDescriptionChange={onDescriptionChange}
          onIsScheduledChange={onIsScheduledChange}
          onDateChange={onDateChange}
          onStartTimeChange={setStartTime}
          onEndTimeChange={setEndTime}
          onPriorityChange={setPriority}
          onReminderEnabledChange={setReminderEnabled}
          onReminderTimeChange={setReminderTime}
          onSubtasksChange={onSubtasksChange}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
