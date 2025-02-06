import { TaskPriority } from "@/components/dashboard/TaskBoard";

export const getPriorityColor = (priority: TaskPriority | undefined) => {
  switch (priority) {
    case 'high':
      return 'bg-red-50 hover:bg-red-100';
    case 'medium':
      return 'bg-yellow-50 hover:bg-yellow-100';
    case 'low':
      return 'bg-green-50 hover:bg-green-100';
    default:
      return 'bg-gray-50 hover:bg-gray-100';
  }
};

export function getUrgencyColor(time: string) {
  if (!time) return 'bg-white/20'; // For unscheduled tasks
  
  const [startTime] = time.split(' - ');
  const [hours, minutes] = startTime.split(':').map(Number);
  
  const taskTime = new Date();
  taskTime.setHours(hours, minutes, 0, 0);
  
  const now = new Date();
  const diffInHours = (taskTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours > 6) return 'bg-white';
  if (diffInHours > 4) return 'bg-yellow-500';
  if (diffInHours > 2) return 'bg-orange-500';
  return 'bg-red-500';
}