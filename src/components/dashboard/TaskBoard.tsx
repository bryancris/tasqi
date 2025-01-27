import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function TaskBoard() {
  const tasks = [
    {
      id: 1,
      title: "Do the billing report",
      date: "2024-01-27",
      status: "scheduled",
      time: "09:00 - 10:00",
      color: "bg-green-100 text-green-700",
    },
    {
      id: 2,
      title: "Pick up daughter from school",
      date: "2024-01-27",
      status: "scheduled",
      time: "15:00 - 16:00",
      color: "bg-orange-100 text-orange-700",
    },
    {
      id: 3,
      title: "Work on the speeds",
      date: "2024-01-27",
      status: "scheduled",
      time: "18:00 - 19:00",
      color: "bg-red-100 text-red-700",
    },
  ];

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
              <div
                key={task.id}
                className={cn(
                  "p-4 rounded-lg flex items-center justify-between",
                  task.color
                )}
              >
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{task.title}</h3>
                    <span className="text-sm">{task.time}</span>
                  </div>
                  <p className="text-sm mt-1 capitalize">
                    Status: {task.status}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-2 hover:bg-white/20"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
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
            {timeSlots.map((time, index) => {
              const task = tasks.find(t => t.time.startsWith(time));
              return (
                <div key={time} className="flex items-start gap-4">
                  <div className="w-16 text-sm text-gray-500">{time}</div>
                  {task && (
                    <div
                      className={cn(
                        "flex-1 p-2 rounded-lg",
                        task.color
                      )}
                    >
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm">{task.time}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}