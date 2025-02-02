import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimelineSlot } from "../TimelineSlot";
import { Task } from "../TaskBoard";

interface TimelineSectionProps {
  tasks: Task[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function TimelineSection({ tasks, selectedDate, onDateChange }: TimelineSectionProps) {
  // For now, hardcode the range. Later this will come from user settings
  const startHour = 9;
  const endHour = 20;

  const timeSlots = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => {
      const hour = startHour + i;
      return hour.toString().padStart(2, '0') + ':00';
    }
  );

  // Get all scheduled tasks for the timeline (not filtered by date)
  const allScheduledTasks = tasks.filter(task => 
    task.status === 'scheduled'
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeSlots.map((timeSlot) => (
            <TimelineSlot 
              key={timeSlot} 
              time={timeSlot} 
              tasks={allScheduledTasks}
              selectedDate={selectedDate}
              onDateChange={onDateChange}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}