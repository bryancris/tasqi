import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { TaskPriority } from "./TaskBoard";
import { TaskScheduleFields } from "./TaskScheduleFields";

interface TaskFormProps {
  title: string;
  description: string;
  isScheduled: boolean;
  date: string;
  startTime: string;
  endTime: string;
  priority: TaskPriority;
  reminderEnabled: boolean;
  isLoading: boolean;
  isEditing?: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIsScheduledChange: (value: boolean) => void;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onPriorityChange: (value: TaskPriority) => void;
  onReminderEnabledChange: (value: boolean) => void;
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
  isLoading,
  isEditing = false,
  onTitleChange,
  onDescriptionChange,
  onIsScheduledChange,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onPriorityChange,
  onReminderEnabledChange,
  onSubmit,
}: TaskFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="p-4 space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Task title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Task description"
        />
      </div>

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

      {isScheduled && (
        <div className="flex items-center space-x-2">
          <Switch
            id="reminder"
            checked={reminderEnabled}
            onCheckedChange={onReminderEnabledChange}
          />
          <Label htmlFor="reminder">Enable notifications</Label>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : isEditing ? "Update Task" : "Create Task"}
      </Button>
    </form>
  );
}