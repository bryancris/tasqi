
import { TaskBasicFields } from "../TaskBasicFields";
import { TaskNotificationFields } from "../TaskNotificationFields";
import { TaskAttachmentFields } from "../TaskAttachmentFields";
import { TaskScheduleFields } from "../../TaskScheduleFields";
import { SubtaskList, Subtask } from "../../subtasks/SubtaskList";
import { Task, TaskPriority } from "../../TaskBoard";
import { FormSection } from "../sections/FormSection";

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
  task?: Task;
  isEditing?: boolean;
  isMobile: boolean;
  fcmStatus: 'loading' | 'ready' | 'error';
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
  handleReminderToggle: (enabled: boolean, callback?: (enabled: boolean) => void) => Promise<void>;
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
  task,
  isEditing = false,
  isMobile,
  fcmStatus,
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
  handleReminderToggle,
}: TaskFormContentProps) {
  return (
    <div className="p-4 space-y-6">
      <FormSection>
        <TaskBasicFields
          title={title}
          description={description}
          onTitleChange={onTitleChange}
          onDescriptionChange={onDescriptionChange}
        />
      </FormSection>

      <FormSection>
        <SubtaskList 
          subtasks={subtasks} 
          onSubtasksChange={onSubtasksChange}
        />
      </FormSection>

      <FormSection>
        <TaskNotificationFields
          reminderEnabled={reminderEnabled}
          reminderTime={reminderTime}
          fcmStatus={fcmStatus}
          onReminderEnabledChange={(enabled) => handleReminderToggle(enabled, onReminderEnabledChange)}
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
        <TaskAttachmentFields task={task} isEditing={isEditing} />
      </FormSection>
    </div>
  );
}
