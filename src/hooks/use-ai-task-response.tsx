
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { Subtask } from "@/components/dashboard/subtasks/SubtaskList";

interface UseAiTaskResponseProps {
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIsScheduledChange: (value: boolean) => void;
  onDateChange: (value: string) => void;
  onSubtasksChange: (subtasks: Subtask[]) => void;
}

export function useAiTaskResponse({
  onTitleChange,
  onDescriptionChange,
  onIsScheduledChange,
  onDateChange,
  onSubtasksChange,
}: UseAiTaskResponseProps) {
  const [processingAIResponse, setProcessingAIResponse] = useState(false);

  useEffect(() => {
    const handleAIResponse = (e: CustomEvent<any>) => {
      console.log('AI Response received in TaskForm:', e.detail);
      
      if (e.detail?.task) {
        setProcessingAIResponse(true);
        
        try {
          const taskData = e.detail.task;
          console.log('Processing task data:', taskData);

          onTitleChange(taskData.title || '');
          onDescriptionChange(taskData.description || '');
          onIsScheduledChange(!!taskData.is_scheduled);
          if (taskData.date) onDateChange(taskData.date);

          if (taskData.subtasks && Array.isArray(taskData.subtasks)) {
            console.log('Setting subtasks:', taskData.subtasks);
            const newSubtasks = taskData.subtasks.map((subtask: any, index: number) => ({
              title: subtask.title,
              status: 'pending',
              position: index
            }));
            onSubtasksChange(newSubtasks);
            
            toast({
              title: "Subtasks Added",
              description: `Added ${newSubtasks.length} subtasks to your task.`,
            });
          }
        } catch (error) {
          console.error('Error processing AI response:', error);
          toast({
            title: "Error",
            description: "Failed to process AI response",
            variant: "destructive",
          });
        } finally {
          setProcessingAIResponse(false);
        }
      }
    };

    window.addEventListener('ai-response', handleAIResponse as EventListener);
    return () => window.removeEventListener('ai-response', handleAIResponse as EventListener);
  }, [onTitleChange, onDescriptionChange, onIsScheduledChange, onDateChange, onSubtasksChange]);

  return { processingAIResponse };
}
