
import { TaskForm } from "../TaskForm";
import { Task, TaskPriority } from "../TaskBoard";
import { Subtask } from "../subtasks/SubtaskList";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface EditTaskContentProps {
  task: Task;
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
  onDelete: () => void;
}

export function EditTaskContent({
  task,
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
  onSubmit,
  onDelete
}: EditTaskContentProps) {
  console.log("EditTaskContent rendered with onSubmit:", !!onSubmit);
  
  return (
    <div className="pt-6 flex flex-col h-full">
      <TaskForm
        task={task}
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
        isEditing={true}
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
      
      <div className="mt-6 px-4">
        <Button
          type="button"
          variant="destructive"
          className="w-full"
          onClick={onDelete}
          disabled={isLoading}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Task
        </Button>
      </div>
    </div>
  );
}
