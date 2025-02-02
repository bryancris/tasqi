import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";
import { TaskPriority } from "./TaskBoard";

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
  const selectedDate = date ? parse(date, 'yyyy-MM-dd', new Date()) : undefined;

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

      <div className="flex items-center space-x-2">
        <Switch
          id="scheduled"
          checked={isScheduled}
          onCheckedChange={onIsScheduledChange}
        />
        <Label htmlFor="scheduled">Schedule this task</Label>
      </div>

      {isScheduled && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <div className="flex">
              <Input
                value={date}
                onChange={(e) => onDateChange(e.target.value)}
                placeholder="YYYY-MM-DD"
                className="rounded-r-none"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "rounded-l-none border-l-0",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" side="bottom">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(newDate) => {
                      if (newDate) {
                        onDateChange(format(newDate, 'yyyy-MM-dd'));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => onStartTimeChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => onEndTimeChange(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => onPriorityChange(e.target.value as TaskPriority)}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="reminder"
              checked={reminderEnabled}
              onCheckedChange={onReminderEnabledChange}
            />
            <Label htmlFor="reminder">Enable notifications</Label>
          </div>
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