
import { Task } from "@/components/dashboard/TaskBoard";

export function usePositionCalculation() {
  // Calculate new positions with larger intervals for tasks
  const calculateNewPositions = (updatedTasks: Task[]) => {
    return updatedTasks.map((task, index) => ({
      task_id: task.id,
      new_position: (index + 1) * 1000
    }));
  };

  return { calculateNewPositions };
}
