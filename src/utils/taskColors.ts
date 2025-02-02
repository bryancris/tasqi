import { TaskPriority } from "@/components/dashboard/TaskBoard";

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

export function getPriorityColor(priority?: TaskPriority) {
  switch (priority) {
    case 'high':
      return 'bg-red-500';
    case 'medium':
      return 'bg-orange-400';
    case 'low':
      return 'bg-green-500';
    default:
      return 'bg-blue-500';
  }
}