import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Task Board</CardTitle>
        <Button size="sm">
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
                "p-4 rounded-lg",
                task.color
              )}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{task.title}</h3>
                <span className="text-sm">{task.time}</span>
              </div>
              <p className="text-sm mt-1">
                Status: {task.status}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}