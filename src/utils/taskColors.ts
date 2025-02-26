import { TaskPriority } from "@/components/dashboard/TaskBoard";

export const getPriorityColor = (priority: TaskPriority | undefined) => {
  switch (priority) {
    case 'high':
      return 'bg-[#EA384C]'; // Bright red
    case 'medium':
      return 'bg-[#F97316]'; // Bright orange
    case 'low':
      return 'bg-[#22C55E]'; // Bright green
    default:
      return 'bg-[#33C3F0]'; // Bright blue for unscheduled
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
