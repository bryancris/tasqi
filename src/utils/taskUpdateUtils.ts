import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";

interface UpdateTaskTimeParams {
  taskId: number;
  dateStr: string;
  startTime: string;
  endTime: string;
}

export const validateDateFormat = (dateStr: string) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    console.error('Invalid date format:', dateStr);
    throw new Error('Invalid date format in cell ID');
  }
};

export const validateHourFormat = (hour: string) => {
  const hourNum = parseInt(hour);
  if (isNaN(hourNum) || hourNum < 0 || hourNum > 23) {
    console.error('Invalid hour:', hour);
    throw new Error('Invalid hour in cell ID');
  }
  return hourNum;
};

export const updateTaskToUnscheduled = async (taskId: number) => {
  const { error } = await supabase
    .from('tasks')
    .update({
      status: 'unscheduled',
      date: null,
      start_time: null,
      end_time: null
    })
    .eq('id', taskId);

  if (error) throw error;
};

export const updateTaskTime = async ({ taskId, dateStr, startTime, endTime }: UpdateTaskTimeParams) => {
  console.log('Updating task:', { taskId, date: dateStr, startTime, endTime });
  
  const { error } = await supabase
    .from('tasks')
    .update({
      status: 'scheduled',
      date: dateStr,
      start_time: startTime,
      end_time: endTime
    })
    .eq('id', taskId);

  if (error) throw error;
};