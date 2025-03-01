
import { TaskForm } from "../TaskForm";
import { TaskPriority } from "../TaskBoard";
import { Subtask } from "../subtasks/SubtaskList";

interface AddTaskContentProps {
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

export function AddTaskContent({
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
  onSubmit
}: AddTaskContentProps) {
  console.log("AddTaskContent rendered with onSubmit:", !!onSubmit);
  
  return (
    <div className="pt-6">
      <TaskForm
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
        isLoading={isLoading}
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
        onSubmit={onSubmit}
      />
    </div>
  );
}
