
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
  onSubtasksChange,
  onSubmit,
  onDelete,
}: EditTaskContentProps) {
  const isMobile = useIsMobile();

  return (
    <div className={`${isMobile ? 'h-[calc(100vh-5rem)] pb-20' : 'h-[calc(100vh-80px)]'} overflow-y-auto scrollbar-hide`}>
      <div className="space-y-6">
        <TaskForm
          title={title}
          description={description}
          isScheduled={isScheduled}
          date={date}
          startTime={startTime}
          endTime={endTime}
          priority={priority}
          reminderEnabled={reminderEnabled}
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
          onSubtasksChange={onSubtasksChange}
          onSubmit={onSubmit}
        />
        <div className="mt-6">
          <DeleteTaskAlert 
            isLoading={isLoading} 
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  );
}
