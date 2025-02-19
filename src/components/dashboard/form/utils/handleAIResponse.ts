
import { toast } from "sonner";
import { Subtask } from "../../subtasks/SubtaskList";

interface AIResponseHandlers {
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIsScheduledChange: (value: boolean) => void;
  onDateChange: (value: string) => void;
  onSubtasksChange: (subtasks: Subtask[]) => void;
}

export const handleAIResponse = (
  e: CustomEvent<any>,
  handlers: AIResponseHandlers
) => {
  const { onTitleChange, onDescriptionChange, onIsScheduledChange, onDateChange, onSubtasksChange } = handlers;

  if (e.detail?.task) {
    const taskData = e.detail.task;
    
    try {
      onTitleChange(taskData.title || '');
      onDescriptionChange(taskData.description || '');
      onIsScheduledChange(!!taskData.is_scheduled);
      if (taskData.date) onDateChange(taskData.date);

      if (taskData.subtasks && Array.isArray(taskData.subtasks)) {
        const newSubtasks = taskData.subtasks.map((subtask: any, index: number) => ({
          title: subtask.title,
          status: 'pending',
          position: index
        }));
        onSubtasksChange(newSubtasks);
        
        toast(`Added ${newSubtasks.length} subtasks to your task.`);
      }
    } catch (error) {
      console.error('Error processing AI response:', error);
      toast("Failed to process AI response");
      throw error;
    }
  }
};
