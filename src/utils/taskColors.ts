
import { TaskPriority } from "@/components/dashboard/TaskBoard";

export const getPriorityColor = (priority: TaskPriority | undefined) => {
  // For completed tasks, we want to show gray regardless of priority
  switch (priority) {
    case 'high':
      return 'bg-[#F87171]'; // More muted red
    case 'medium':
      return 'bg-[#FB923C]'; // More muted orange
    case 'low':
      return 'bg-[#4ADE80]'; // More muted green
    default:
      return 'bg-[#60A5FA]'; // More muted blue
  }
};

export const getUrgencyColor = (time: string) => {
  if (!time) return 'bg-gray-500';
  
  const [, endTime] = time.split(' - ');
  if (!endTime) return 'bg-gray-500';
  
  const [hours, minutes] = endTime.split(':').map(Number);
  const taskEndTime = new Date();
  taskEndTime.setHours(hours, minutes, 0, 0);
  
  const now = new Date();
  const diffInMinutes = (taskEndTime.getTime() - now.getTime()) / (1000 * 60);
  
  if (diffInMinutes < 0) return 'bg-red-500';
  if (diffInMinutes < 30) return 'bg-orange-500';
  return 'bg-green-500';
};

