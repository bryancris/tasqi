
import { Task } from "./TaskBoard";
import { TaskBoardSection } from "./task-board/TaskBoardSection";
import { DesktopTimelineSection } from "./timeline/DesktopTimelineSection";
import { DragEndEvent } from "@dnd-kit/core";
import { QueryObserverResult } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface DesktopTaskViewProps {
  tasks: Task[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onComplete?: () => void | Promise<QueryObserverResult<Task[], Error>>;
}

export function DesktopTaskView({ tasks, selectedDate, onDateChange, onDragEnd, onComplete }: DesktopTaskViewProps) {
  const [activeView, setActiveView] = useState<'board' | 'timeline'>('board');
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full p-6">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">
            {activeView === 'board' ? 'Task Board' : 'Timeline View'}
          </h2>
          <Button
            variant="rainbow"
            onClick={() => setActiveView(activeView === 'board' ? 'timeline' : 'board')}
            className="text-base font-medium"
          >
            Switch to {activeView === 'board' ? 'Timeline' : 'Board'}
          </Button>
        </div>
        
        {activeView === 'board' ? (
          <TaskBoardSection 
            tasks={tasks} 
            selectedDate={selectedDate} 
            onDragEnd={onDragEnd} 
            onComplete={onComplete} 
          />
        ) : (
          <DesktopTimelineSection 
            selectedDate={selectedDate} 
            onDateChange={onDateChange} 
          />
        )}
      </div>
    </div>
  );
}
