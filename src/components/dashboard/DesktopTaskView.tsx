
import { Task } from "./TaskBoard";
import { TaskBoardSection } from "./task-board/TaskBoardSection";
import { TimelineSection } from "./timeline/TimelineSection";
import { DragEndEvent } from "@dnd-kit/core";
import { QueryObserverResult } from "@tanstack/react-query";

interface DesktopTaskViewProps {
  tasks: Task[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onComplete?: () => void | Promise<QueryObserverResult<Task[], Error>>;
}

export function DesktopTaskView({ tasks, selectedDate, onDateChange, onDragEnd, onComplete }: DesktopTaskViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full p-6">
      <div className="flex flex-col h-full">
        <TaskBoardSection tasks={tasks} onDragEnd={onDragEnd} onComplete={onComplete} />
      </div>
      <div className="flex flex-col h-full">
        <TimelineSection 
          tasks={tasks} 
          selectedDate={selectedDate} 
          onDateChange={onDateChange} 
        />
      </div>
    </div>
  );
}
