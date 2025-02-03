import { Button } from "@/components/ui/button";
import { PenLine, BarChart2, Zap, MessageSquare } from "lucide-react";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function ToolsSection() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      <Button 
        variant="ghost" 
        className="w-full justify-start text-[#9333EA] hover:bg-[#E5E7EB]"
        onClick={() => navigate("/notes")}
      >
        <PenLine className="mr-2 h-4 w-4" />
        Notes
      </Button>
      <Button 
        variant="ghost" 
        className="w-full justify-start text-[#6B7280] hover:bg-[#E5E7EB]"
        onClick={() => navigate("/analytics")}
      >
        <BarChart2 className="mr-2 h-4 w-4" />
        Analytics
      </Button>
      <Button 
        variant="ghost" 
        className="w-full justify-start text-[#EA580C] hover:bg-[#E5E7EB]"
      >
        <Zap className="mr-2 h-4 w-4" />
        Self-Care
      </Button>
      <Button 
        variant="ghost" 
        className="w-full justify-start text-blue-600 bg-[#E5DEFF] hover:bg-[#9b87f5] hover:text-white transform transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-[#9b87f5] rounded-lg hover:-translate-y-0.5"
        onClick={() => setIsChatOpen(true)}
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        Tasqi AI Assistant
      </Button>
      <ChatBubble 
        variant="sidebar" 
        isOpen={isChatOpen} 
        onOpenChange={setIsChatOpen}
      />
    </div>
  );
}