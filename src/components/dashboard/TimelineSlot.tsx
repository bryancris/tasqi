import { Task } from "./TaskBoard";
import { getPriorityColor } from "@/utils/taskColors";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface TimelineSlotProps {
  time: string;
  tasks: Task[];
}

export function TimelineSlot({ time, tasks }: TimelineSlotProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handlePreviousDay = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 1);
      return newDate;
    });
  };

  const handleNextDay = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 1);
      return newDate;
    });
  };

  // Only render the date navigation for the first time slot
  if (time === "09:00") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4 py-2 bg-white rounded-lg shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousDay}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium">
              {format(selectedDate, "MMMM d, yyyy")}
            </span>
            <span className="text-xs text-muted-foreground">
              Daily
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextDay}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <TimeSlotContent time={time} tasks={tasks} />
      </div>
    );
  }

  return <TimeSlotContent time={time} tasks={tasks} />;
}

// Extracted the original timeline slot content into a separate component
function TimeSlotContent({ time, tasks }: TimelineSlotProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex items-start gap-4">
        <div className="w-16 text-sm text-gray-500">{time}</div>
        <div className="flex-1 min-h-[2rem] border-l-2 border-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4">
      <div className="w-16 text-sm text-gray-500">{time}</div>
      <div className="flex-1 space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`p-2 rounded-lg text-white ${getPriorityColor(task.priority)}`}
          >
            <p className="font-medium">{task.title}</p>
            {task.start_time && task.end_time && (
              <p className="text-sm opacity-90">{`${task.start_time} - ${task.end_time}`}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}