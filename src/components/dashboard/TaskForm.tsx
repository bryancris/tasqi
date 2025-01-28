import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskScheduleFields } from "./TaskScheduleFields";
import { TaskPriority } from "./TaskBoard";

interface TaskFormProps {
  title: string;
  description: string;
  isScheduled: boolean;
  date: string;
  startTime: string;
  endTime: string;
  priority: TaskPriority;
  isLoading: boolean;
  isEditing?: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIsScheduledChange: (value: boolean) => void;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onPriorityChange: (value: TaskPriority) => void;
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
  isLoading,
  isEditing = false,
  onTitleChange,
  onDescriptionChange,
  onIsScheduledChange,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onPriorityChange,
  onSubmit,
}: TaskFormProps) {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input 
          id="title" 
          placeholder="Enter task title" 
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="date">Schedule Task</Label>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {isScheduled ? "Scheduled" : "Unscheduled"}
          </span>
          <Switch 
            id="date" 
            checked={isScheduled}
            onCheckedChange={onIsScheduledChange}
          />
        </div>
      </div>
      
      {isScheduled && (
        <TaskScheduleFields
          date={date}
          startTime={startTime}
          endTime={endTime}
          onDateChange={onDateChange}
          onStartTimeChange={onStartTimeChange}
          onEndTimeChange={onEndTimeChange}
        />
      )}
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          placeholder="Add description" 
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select value={priority} onValueChange={onPriorityChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Button 
        className="w-full bg-black text-white hover:bg-gray-800"
        onClick={onSubmit}
        disabled={!title || isLoading}
      >
        {isLoading ? "Creating..." : isEditing ? "Update Task" : "Add Task"}
      </Button>
    </div>
  );
}