import { format } from "date-fns";
import { Task } from "@/components/dashboard/TaskBoard";

export const getCompletionDate = (task: Task): string => {
  if (task.completed_at) {
    return format(new Date(task.completed_at), 'MMM d, yyyy');
  }
  return '';
};

export const getTimeDisplay = (task: Task): string => {
  if (task.start_time && task.end_time) {
    return `${task.start_time} - ${task.end_time}`;
  }
  return '';
};