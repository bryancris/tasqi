
import { Button } from "@/components/ui/button";
import { PenLine, BarChart2, Zap, MessageSquare } from "lucide-react";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function ToolsSection() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const location = useLocation();
  
  // Update to check for only /dashboard/notes path
  const isNotesActive = location.pathname === '/dashboard/notes';
  const isAnalyticsActive = location.pathname === '/dashboard/analytics';
  const isSelfCareActive = location.pathname === '/dashboard/self-care';

  return (
    <div className="space-y-2">
      <Link to="/dashboard/notes">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start text-base text-[#9333EA] hover:bg-[#E5E7EB]",
            isNotesActive && "bg-[#E5E7EB]"
          )}
        >
          <PenLine className="mr-2 h-5 w-5" />
          Notes
        </Button>
      </Link>
      
      <Link to="/dashboard/analytics">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start text-base hover:bg-[#E5E7EB] text-[#FF6B6B]",
            isAnalyticsActive && "bg-[#E5E7EB]"
          )}
        >
          <BarChart2 className="mr-2 h-5 w-5" />
          Analytics
        </Button>
      </Link>
      
      <Link to="/dashboard/self-care">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start text-base text-[#EA580C] hover:bg-[#E5E7EB]",
            isSelfCareActive && "bg-[#E5E7EB]"
          )}
        >
          <Zap className="mr-2 h-5 w-5" />
          Self-Care
        </Button>
      </Link>
      
      <Button 
        variant="ghost" 
        className="w-full justify-start text-base text-blue-600 bg-[#E5DEFF] hover:bg-[#9b87f5] hover:text-white transform transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-[#9b87f5] rounded-lg hover:-translate-y-0.5" 
        onClick={() => setIsChatOpen(true)}
      >
        <MessageSquare className="mr-2 h-5 w-5" />
        Tasqi AI Assistant
      </Button>
      
      <ChatBubble 
        variant="sidebar" 
        isOpen={isChatOpen} 
        onOpenChange={setIsChatOpen}
        hideFloatingButton={true}
      />
    </div>
  );
}
