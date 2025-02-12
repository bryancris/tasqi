import { Button } from "@/components/ui/button";
import { PenLine, BarChart2, Zap, MessageSquare } from "lucide-react";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
export function ToolsSection() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const navigate = useNavigate();
  return <div className="space-y-2">
      <Button variant="ghost" className="w-full justify-start text-base text-[#9333EA] hover:bg-[#E5E7EB]" onClick={() => navigate("/notes")}>
        <PenLine className="mr-2 h-5 w-5" />
        Notes
      </Button>
      <Button variant="ghost" onClick={() => navigate("/analytics")} className="w-full justify-start text-base hover:bg-[#E5E7EB] text-[#bf275f]/0">
        <BarChart2 className="mr-2 h-5 w-5" />
        Analytics
      </Button>
      <Button variant="ghost" className="w-full justify-start text-base text-[#EA580C] hover:bg-[#E5E7EB]" onClick={() => navigate("/self-care")}>
        <Zap className="mr-2 h-5 w-5" />
        Self-Care
      </Button>
      <Button variant="ghost" className="w-full justify-start text-base text-blue-600 bg-[#E5DEFF] hover:bg-[#9b87f5] hover:text-white transform transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-[#9b87f5] rounded-lg hover:-translate-y-0.5" onClick={() => setIsChatOpen(true)}>
        <MessageSquare className="mr-2 h-5 w-5" />
        Tasqi AI Assistant
      </Button>
      <ChatBubble variant="sidebar" isOpen={isChatOpen} onOpenChange={setIsChatOpen} />
    </div>;
}