
import { FormSection } from "./sections/FormSection";
import { TaskBasicFields } from "./TaskBasicFields";
import { SubtasksSection } from "./sections/SubtasksSection";
import { TaskNotificationFields } from "./TaskNotificationFields";
import { TaskScheduleFields } from "../TaskScheduleFields";
import { TaskAttachmentFields } from "./TaskAttachmentFields";
import { Task, TaskPriority } from "../TaskBoard";
import { Subtask } from "../subtasks/SubtaskList";

interface TaskFormContentProps {
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
  fcmStatus: 'loading' | 'ready' | 'error';
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
  handleReminderToggle: (enabled: boolean) => Promise<void>;
}

export function TaskFormContent({
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
  fcmStatus,
  isEditing,
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
  handleReminderToggle
}: TaskFormContentProps) {
  return (
    <div className="space-y-6">
      <FormSection>
        <TaskBasicFields 
          title={title} 
          description={description} 
          onTitleChange={onTitleChange} 
          onDescriptionChange={onDescriptionChange} 
        />
      </FormSection>

      <SubtasksSection 
        subtasks={subtasks} 
        onSubtasksChange={onSubtasksChange} 
      />

      <FormSection>
        <TaskNotificationFields 
          reminderEnabled={reminderEnabled} 
          reminderTime={reminderTime} 
          fcmStatus={fcmStatus} 
          onReminderEnabledChange={handleReminderToggle} 
          onReminderTimeChange={onReminderTimeChange} 
        />
      </FormSection>

      <FormSection>
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
      </FormSection>

      <FormSection>
        <TaskAttachmentFields 
          task={task} 
          isEditing={isEditing} 
        />
      </FormSection>
    </div>
  );
}
