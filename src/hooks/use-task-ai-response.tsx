
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Subtask } from "@/components/dashboard/subtasks/SubtaskList";

export function useAiTaskResponse({
  onTitleChange,
  onDescriptionChange,
  onIsScheduledChange,
  onDateChange,
  onSubtasksChange,
}: {
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIsScheduledChange: (value: boolean) => void;
  onDateChange: (value: string) => void;
  onSubtasksChange: (subtasks: Subtask[]) => void;
}) {
  const [processingAIResponse, setProcessingAIResponse] = useState(false);

  useEffect(() => {
    const handleAIResponse = (e: CustomEvent<any>) => {
      console.log('🤖 AI Response received in TaskForm:', e.detail);
      
      if (e.detail?.task) {
        setProcessingAIResponse(true);
        
        try {
          const taskData = e.detail.task;
          console.log('📊 Processing task data in AI response handler:', taskData);

          // Set title with validation
          if (taskData.title && typeof taskData.title === 'string') {
            console.log('✏️ Setting task title:', taskData.title);
            onTitleChange(taskData.title);
          } else {
            console.warn('⚠️ No valid title in task data');
          }
          
          // Set description with validation
          if (taskData.description && typeof taskData.description === 'string') {
            console.log('📝 Setting task description:', taskData.description);
            onDescriptionChange(taskData.description);
          } else {
            console.log('ℹ️ No description in task data, setting empty string');
            onDescriptionChange('');
          }
          
          // Handle scheduling based on date
          const hasDate = !!taskData.date && typeof taskData.date === 'string';
          console.log('📅 Task has date:', hasDate, taskData.date);
          onIsScheduledChange(hasDate);
          
          // Set date if available
          if (hasDate) {
            console.log('📅 Setting task date:', taskData.date);
            onDateChange(taskData.date);
          }

          // Handle subtasks if available
          if (taskData.subtasks && Array.isArray(taskData.subtasks)) {
            console.log('📋 Setting subtasks:', taskData.subtasks);
            const newSubtasks = taskData.subtasks.map((subtask: any, index: number) => ({
              title: subtask.title,
              status: 'pending',
              position: index
            }));
            onSubtasksChange(newSubtasks);
            
            toast.success(`Added ${newSubtasks.length} subtasks to your task.`);
          }
          
          // Notify the user that a task was created
          toast.success("Task created by AI assistant");
        } catch (error) {
          console.error('❌ Error processing AI response:', error);
          toast.error("Failed to process AI response");
        } finally {
          setProcessingAIResponse(false);
        }
      } else {
        console.warn('⚠️ AI Response event received but no task data found:', e.detail);
      }
    };

    window.addEventListener('ai-response', handleAIResponse as EventListener);
    return () => window.removeEventListener('ai-response', handleAIResponse as EventListener);
  }, [onTitleChange, onDescriptionChange, onIsScheduledChange, onDateChange, onSubtasksChange]);

  return { processingAIResponse };
}

// Also export it as useTaskAIResponse for backward compatibility
export const useTaskAIResponse = useAiTaskResponse;
