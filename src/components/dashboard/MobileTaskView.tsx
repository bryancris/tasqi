import { Button } from "@/components/ui/button";
import { Plus, Calendar, Home, FileText, MessageSquare, Settings } from "lucide-react";
import { TaskCard } from "./TaskCard";

interface MobileTaskViewProps {
  tasks: Array<{
    id: number;
    title: string;
    date: string;
    status: string;
    time: string;
    color: string;
  }>;
}

export function MobileTaskView({ tasks }: MobileTaskViewProps) {
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
          <TaskCard key={task.id} task={task} isMobile />
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-around items-center p-4 border-t">
        <Button variant="ghost" size="icon" className="text-[#6366F1]">
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Daily</span>
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400">
          <Calendar className="h-5 w-5" />
          <span className="text-xs mt-1">Week</span>
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400">
          <FileText className="h-5 w-5" />
          <span className="text-xs mt-1">Notes</span>
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400">
          <MessageSquare className="h-5 w-5" />
          <span className="text-xs mt-1">Chat</span>
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400">
          <Settings className="h-5 w-5" />
          <span className="text-xs mt-1">Settings</span>
        </Button>
      </div>
    </div>
  );
}