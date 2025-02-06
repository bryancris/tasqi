
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
    <Card className="h-full w-80">
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
          <div key={task.id} className="bg-[#1EAEDB] text-white rounded-lg p-3">
            <DraggableTask key={task.id} task={task} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
