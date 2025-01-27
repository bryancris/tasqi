import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, List, MessageSquare, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export function TaskBoard() {
  const isMobile = useIsMobile();
  
  const tasks = [
    {
      id: 1,
      title: "Do the billing report",
      date: "2024-01-27",
      status: "scheduled",
      time: "09:00 - 10:00",
      color: "bg-emerald-400",
    },
    {
      id: 2,
      title: "Test Unscheduled Tasks",
      date: "2024-01-27",
      status: "unscheduled",
      time: "",
      color: "bg-blue-500",
    },
    {
      id: 3,
      title: "Work on the speeds",
      date: "2024-01-27",
      status: "scheduled",
      time: "18:00 - 19:00",
      color: "bg-red-500",
    },
    {
      id: 4,
      title: "Pick up daughter from school",
      date: "2024-01-27",
      status: "scheduled",
      time: "15:00 - 16:00",
      color: "bg-orange-400",
    },
  ];

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-white">
        {/* Header */}
        <div className="flex justify-between items-center p-4">
          <div>
            <h1 className="text-xl font-semibold text-[#6366F1]">TasqiAI</h1>
            <p className="text-sm text-gray-500">15:38 Mon, Jan 27</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-[#F1F5F9] hover:bg-gray-200"
          >
            <Plus className="h-4 w-4 text-gray-600" />
          </Button>
        </div>

        {/* Tasks List */}
        <div className="flex-1 px-4 space-y-3 overflow-auto">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "p-4 rounded-xl flex items-center justify-between text-white w-full",
                task.color
              )}
            >
              <div className="flex items-center space-x-3">
                <div className="grid grid-cols-2 gap-0.5">
                  <div className="w-1 h-1 bg-white/50 rounded-full" />
                  <div className="w-1 h-1 bg-white/50 rounded-full" />
                  <div className="w-1 h-1 bg-white/50 rounded-full" />
                  <div className="w-1 h-1 bg-white/50 rounded-full" />
                </div>
                <div>
                  <h3 className="font-medium">{task.title}</h3>
                  <p className="text-sm opacity-90">{task.time || task.date}</p>
                </div>
              </div>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
                <List className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Navigation */}
        <div className="flex justify-around items-center p-4 border-t">
          <Button variant="ghost" size="icon" className="text-[#6366F1]">
            <List className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400">
            <Calendar className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400">
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

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
                  <Clock className="h-4 w-4" />
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
