import { Button } from "@/components/ui/button";
import { PenLine, BarChart2, Zap, MessageSquare } from "lucide-react";
import { ChatBubble } from "@/components/chat/ChatBubble";

export function ToolsSection() {
  return (
    <div className="space-y-2">
      <Button 
        variant="ghost" 
        className="w-full justify-start text-[#9333EA] hover:bg-[#E5E7EB]"
      >
        <PenLine className="mr-2 h-4 w-4" />
        Notes
      </Button>
      <Button 
        variant="ghost" 
        className="w-full justify-start text-[#6B7280] hover:bg-[#E5E7EB]"
      >
        <BarChart2 className="mr-2 h-4 w-4" />
        Analytics
      </Button>
      <Button 
        variant="ghost" 
        className="w-full justify-start text-[#EA580C] hover:bg-[#E5E7EB]"
      >
        <Zap className="mr-2 h-4 w-4" />
        Habit Tracking
      </Button>
      <ChatBubble variant="sidebar">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-blue-600 hover:bg-[#E5E7EB]"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Tasqi AI Assistant
        </Button>
      </ChatBubble>
    </div>
  );
}