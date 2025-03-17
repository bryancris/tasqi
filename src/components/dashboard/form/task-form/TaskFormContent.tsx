
import { TaskBasicFields } from "../TaskBasicFields";
import { TaskNotificationFields } from "../../../notifications/TaskNotificationFields";
import { TaskAttachmentFields } from "../TaskAttachmentFields";
import { TaskScheduleFields } from "../../TaskScheduleFields";
import { SubtaskList, Subtask } from "../../subtasks/SubtaskList";
import { Task, TaskPriority } from "../../TaskBoard";
import { FormSection } from "../sections/FormSection";

interface TaskFormContentProps {
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
  task?: Task;
  isEditing?: boolean;
  isMobile: boolean;
  fcmStatus: 'loading' | 'ready' | 'error';
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
  handleReminderToggle: (enabled: boolean, callback?: (enabled: boolean) => void) => Promise<void>;
}

export function TaskFormContent({
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
  task,
  isEditing = false,
  isMobile,
  fcmStatus,
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
}: TaskFormContentProps) {
  // Log the current state for debugging
  console.log(`🔄 TaskFormContent rendering with reminderTime=${reminderTime} (${typeof reminderTime})`);
  console.log(`🔄 Is "At start time"? ${reminderTime === 0 ? "YES" : "NO"}`);

  return (
    <div className="p-4 space-y-4">
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
          onReminderEnabledChange={onReminderEnabledChange}
          onReminderTimeChange={onReminderTimeChange}
        />
      </FormSection>

      <FormSection>
        <TaskScheduleFields
          isScheduled={isScheduled}
          isEvent={isEvent}
          isAllDay={isAllDay}
          date={date}
          startTime={startTime}
          endTime={endTime}
          priority={priority}
          onIsScheduledChange={onIsScheduledChange}
          onIsEventChange={onIsEventChange}
          onIsAllDayChange={onIsAllDayChange}
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
