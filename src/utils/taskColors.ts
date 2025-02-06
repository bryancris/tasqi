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