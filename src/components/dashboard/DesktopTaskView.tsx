import { Task } from "./TaskBoard";
import { TaskBoardSection } from "./task-board/TaskBoardSection";
import { TimelineSection } from "./timeline/TimelineSection";

interface DesktopTaskViewProps {
  tasks: Task[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DesktopTaskView({ tasks, selectedDate, onDateChange }: DesktopTaskViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
      <div className="flex flex-col min-h-0">
        <TaskBoardSection tasks={tasks} />
      </div>
      <TimelineSection 
        tasks={tasks} 
        selectedDate={selectedDate} 
        onDateChange={onDateChange} 
      />
    </div>
  );
}