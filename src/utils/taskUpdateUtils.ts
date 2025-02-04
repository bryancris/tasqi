import { supabase } from "@/integrations/supabase/client";

export const validateDateFormat = (dateStr: string) => {
  console.log('Validating date format:', dateStr);
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    console.error('Invalid date format:', dateStr);
    throw new Error('Invalid date format');
  }
};

export const validateHourFormat = (hour: string) => {
  console.log('Validating hour format:', hour);
  const hourNum = parseInt(hour, 10);
  if (isNaN(hourNum) || hourNum < 0 || hourNum > 23) {
    console.error('Invalid hour:', hour);
    throw new Error('Invalid hour format');
  }
  return hourNum;
};

export const updateTaskToUnscheduled = async (taskId: number) => {
  console.log('Updating task to unscheduled:', taskId);
  const { error } = await supabase
    .from('tasks')
    .update({
      date: null,
      start_time: null,
      end_time: null,
      status: 'unscheduled'
    })
    .eq('id', taskId);

  if (error) throw error;
};

export const updateTaskTime = async ({ 
  taskId, 
  dateStr, 
  startTime, 
  endTime 
}: { 
  taskId: number;
  dateStr: string;
  startTime: string;
  endTime: string;
}) => {
  console.log('Updating task time:', { taskId, dateStr, startTime, endTime });
  
  const { error } = await supabase
    .from('tasks')
    .update({
      date: dateStr,
      start_time: startTime,
      end_time: endTime,
      status: 'scheduled'
    })
    .eq('id', taskId);

  if (error) throw error;
};