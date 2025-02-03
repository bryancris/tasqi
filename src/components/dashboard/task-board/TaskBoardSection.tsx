import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "../TaskCard";
import { Task } from "../TaskBoard";
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useTaskReorder } from "@/hooks/use-task-reorder";
import { startOfDay, isAfter } from "date-fns";

interface TaskBoardSectionProps {
  tasks: Task[];
}

export function TaskBoardSection({ tasks }: TaskBoardSectionProps) {
  const { handleDragEnd: handleReorder } = useTaskReorder(tasks);
  const todayStart = startOfDay(new Date());

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const shouldShowCompletedTask = (task: Task) => {
    return task.completed_at && isAfter(new Date(task.completed_at), todayStart);
  };

  const displayTasks = tasks
    .filter(task => task.status !== 'completed' || shouldShowCompletedTask(task))
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = displayTasks.findIndex(task => task.id === active.id);
    const newIndex = displayTasks.findIndex(task => task.id === over.id);
    
    const newOrder = arrayMove(displayTasks, oldIndex, newIndex);
    const positions = newOrder.map((task, index) => ({
      task_id: task.id,
      new_position: (index + 1) * 1000
    }));

    handleReorder({ destination: { index: newIndex }, source: { index: oldIndex } }, positions);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Board</CardTitle>
      </CardHeader>
      <CardContent>
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={displayTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-4 min-h-[600px] pb-40 relative">
              {displayTasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}