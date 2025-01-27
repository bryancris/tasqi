import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: {
    id: number;
    title: string;
    date: string;
    status: string;
    time: string;
    color: string;
  };
  isMobile?: boolean;
}

export function TaskCard({ task, isMobile = false }: TaskCardProps) {
  if (isMobile) {
    return (
      <div
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
          <MoreVertical className="h-4 w-4" />
        </div>
      </div>
    );
  }

  return (
    <div
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
        <MoreVertical className="h-4 w-4" />
      </Button>
    </div>
  );
}