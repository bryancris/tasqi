import { TaskPriority } from "@/components/dashboard/TaskBoard";

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