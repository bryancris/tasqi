
import { TaskForm } from "../TaskForm";
import { DeleteTaskAlert } from "../DeleteTaskAlert";
import { Task, TaskPriority } from "../TaskBoard";
import { Subtask } from "../subtasks/SubtaskList";
import { useIsMobile } from "@/hooks/use-mobile";

interface EditTaskContentProps {
  task: Task;
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
  onDelete: () => Promise<void>;
}

export function EditTaskContent({
  task,
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
  onDelete,
}: EditTaskContentProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto -mx-6">
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
          isEditing={true}
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
          onSubmit={onSubmit}
        />
      </div>
      
      <div className="px-6 pb-6">
        <DeleteTaskAlert 
          isLoading={isLoading} 
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
