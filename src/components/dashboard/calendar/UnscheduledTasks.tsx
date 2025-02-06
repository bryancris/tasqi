import { Task } from "../TaskBoard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDroppable } from "@dnd-kit/core";
import { DraggableTask } from "../mobile/DraggableTask";

interface UnscheduledTasksProps {
  tasks: Task[];
}

export function UnscheduledTasks({ tasks }: UnscheduledTasksProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'unscheduled',
  });

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Unscheduled Tasks</CardTitle>
      </CardHeader>
      <CardContent 
        ref={setNodeRef}
        className={`space-y-2 min-h-[100px] transition-colors ${
          isOver ? 'bg-blue-50' : ''
        }`}
      >
        {tasks.map((task) => (
          <DraggableTask key={task.id} task={task} />
        ))}
      </CardContent>
    </Card>
  );
}