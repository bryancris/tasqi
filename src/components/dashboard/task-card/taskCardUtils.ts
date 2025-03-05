
import { Task } from "../TaskBoard";

export const getTimeDisplay = (task: Task): string => {
  if (task.start_time && task.end_time) {
    const startTime = task.start_time.split(':').slice(0, 2).join(':');
    const endTime = task.end_time.split(':').slice(0, 2).join(':');
    return `${startTime} - ${endTime}`;
  }
  return '';
};

export const getCardColor = (task: Task): string => {
  if (task.status === 'completed') {
    return 'bg-gray-500';
  }
  
  if (task.status === 'event') {
    return 'bg-cyan-500';
  }
  
  if (task.shared) {
    return 'bg-purple-500';
  }
  
  switch (task.priority) {
    case 'high':
      return 'bg-red-500';
    case 'medium':
      return 'bg-orange-500';
    case 'low':
      return 'bg-blue-500';
    default:
      return 'bg-blue-500';
  }
};
