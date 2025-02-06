import { TaskPriority } from "@/components/dashboard/TaskBoard";

export const getPriorityColor = (priority: TaskPriority | undefined) => {
  switch (priority) {
    case 'high':
      return 'bg-[#FF4444]'; // Bright red for high priority
    case 'medium':
      return 'bg-[#FF8C42]'; // Bright orange for medium priority
    case 'low':
      return 'bg-[#1EAEDB]'; // Changed from green to blue for low priority
    default:
      return 'bg-[#2196F3]'; // Bright blue for unscheduled
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
