
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
    <Card className="h-full w-96"> {/* Increased width from w-80 to w-96 */}
      <CardHeader>
        <CardTitle>Unscheduled Tasks</CardTitle>
      </CardHeader>
      <CardContent 
        ref={setNodeRef}
        className={`space-y-3 min-h-[100px] rounded-md transition-colors p-4 ${
          isOver ? 'bg-[#1EAEDB]/10' : ''
        }`}
      >
        {tasks.map((task) => (
          <DraggableTask key={task.id} task={task} />
        ))}
      </CardContent>
    </Card>
  );
}
