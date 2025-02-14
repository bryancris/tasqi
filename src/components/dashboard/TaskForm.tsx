
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { TaskPriority } from "./TaskBoard";
import { DatePickerInput } from "./form/DatePickerInput";
import { ShareTaskDialog } from "./ShareTaskDialog";
import { TimeSelector } from "./schedule/TimeSelector";
import { SubtaskList, Subtask, SubtaskListHandle } from "./subtasks/SubtaskList";
import { useState, useRef, useEffect } from "react";
import { Task } from "./TaskBoard";
import { useChat } from "@/hooks/use-chat";

interface TaskFormProps {
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
  onSubtasksChange: (subtasks: Subtask[]) => void;
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
  subtasks,
  isLoading,
  isEditing = false,
  task,
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
}: TaskFormProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { message, setMessage } = useChat();
  const [processingAIResponse, setProcessingAIResponse] = useState(false);

  useEffect(() => {
    const handleAIResponse = (e: CustomEvent<any>) => {
      console.log('AI Response received in TaskForm:', e.detail);
      
      if (e.detail?.task) {
        setProcessingAIResponse(true);
        console.log('Task details:', e.detail.task);
        
        try {
          // Update title and description if provided
          if (e.detail.task.title) {
            onTitleChange(e.detail.task.title);
          }
          if (e.detail.task.description) {
            onDescriptionChange(e.detail.task.description);
          }
          
          // Update scheduling if provided
          if (e.detail.task.is_scheduled !== undefined) {
            onIsScheduledChange(e.detail.task.is_scheduled);
          }
          if (e.detail.task.date) {
            onDateChange(e.detail.task.date);
          }
          
          // Handle subtasks - ensure we're creating new subtask objects
          if (e.detail.task.subtasks && Array.isArray(e.detail.task.subtasks)) {
            console.log('Processing subtasks from AI:', e.detail.task.subtasks);
            
            const aiSubtasks = e.detail.task.subtasks.map((subtask: any, index: number) => ({
              title: subtask.title,
              status: 'pending' as const,
              position: index,
            }));
            
            console.log('Created subtask objects:', aiSubtasks);
            
            // Update subtasks state
            onSubtasksChange(aiSubtasks);
          }
        } finally {
          setProcessingAIResponse(false);
        }
      }
    };

    window.addEventListener('ai-response', handleAIResponse as EventListener);
    return () => window.removeEventListener('ai-response', handleAIResponse as EventListener);
  }, [onTitleChange, onDescriptionChange, onIsScheduledChange, onDateChange, onSubtasksChange]);

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

      <div className="space-y-2">
        <Label>Subtasks</Label>
        <SubtaskList 
          subtasks={subtasks} 
          onSubtasksChange={onSubtasksChange}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="scheduled"
            checked={isScheduled}
            onCheckedChange={onIsScheduledChange}
          />
          <Label htmlFor="scheduled">Schedule this task</Label>
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

      {isScheduled && (
        <div className="space-y-4">
          <DatePickerInput
            date={date}
            onDateChange={onDateChange}
          />

          <TimeSelector
            startTime={startTime}
            endTime={endTime}
            onStartTimeChange={onStartTimeChange}
            onEndTimeChange={onEndTimeChange}
          />

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
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || processingAIResponse}
      >
        {isLoading || processingAIResponse ? "Loading..." : isEditing ? "Update Task" : "Create Task"}
      </Button>

      {task && (
        <ShareTaskDialog
          task={task}
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
        />
      )}
    </form>
  );
}
