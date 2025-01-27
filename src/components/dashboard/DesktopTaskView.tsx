import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { TimelineSlot } from "./TimelineSlot";
import { Task } from "./TaskBoard";

interface DesktopTaskViewProps {
  tasks: Task[];
}

export function DesktopTaskView({ tasks }: DesktopTaskViewProps) {
  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 9; // Start from 9 AM
    return `${hour}:00`;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Task Board</CardTitle>
          <Button size="sm" className="bg-[#9b87f5] hover:bg-[#7E69AB]">
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeSlots.map((time) => {
              const task = tasks.find(t => t.time.startsWith(time));
              return (
                <TimelineSlot key={time} time={time} task={task} />
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}