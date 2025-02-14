
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
    // Remove seconds from the time strings if they exist
    const startTime = task.start_time.split(':').slice(0, 2).join(':');
    const endTime = task.end_time.split(':').slice(0, 2).join(':');
    return `${startTime} - ${endTime}`;
  }
  return '';
};
