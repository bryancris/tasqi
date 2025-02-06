import { Task } from "./TaskBoard";
import { TaskBoardSection } from "./task-board/TaskBoardSection";
import { TimelineSection } from "./timeline/TimelineSection";
import { DragEndEvent } from "@dnd-kit/core";

interface DesktopTaskViewProps {
  tasks: Task[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onComplete?: () => void;
}

export function DesktopTaskView({ tasks, selectedDate, onDateChange, onDragEnd, onComplete }: DesktopTaskViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
      <div className="flex flex-col min-h-0">
        <TaskBoardSection tasks={tasks} onDragEnd={onDragEnd} onComplete={onComplete} />
      </div>
      <TimelineSection 
        tasks={tasks} 
        selectedDate={selectedDate} 
        onDateChange={onDateChange} 
      />
    </div>
  );
}