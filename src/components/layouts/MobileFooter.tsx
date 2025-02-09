
import { Home, Calendar, FileText, MessageSquare, Heart, CalendarDays } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChatBubble } from "@/components/chat/ChatBubble";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MobileFooter() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDaily = location.pathname === "/dashboard";
  const isWeekly = location.pathname === "/dashboard/weekly";
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleNavigation = (path: string) => {
    // Close chat if open when navigating
    if (isChatOpen) {
      setIsChatOpen(false);
    }
    navigate(path);
  };

  const handleChatToggle = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#F1F0FB] via-[#E5DEFF] to-[#F1F0FB] border-t py-2 px-4 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center">
          <button 
            className={cn(
              "flex flex-col items-center p-2",
              isDaily ? "text-[#F97316]" : "text-gray-500"
            )}
            onClick={() => handleNavigation("/dashboard")}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">Daily</span>
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className={cn(
                  "flex flex-col items-center p-2",
                  isWeekly ? "text-[#8B5CF6]" : "text-gray-500 hover:text-[#8B5CF6]"
                )}
              >
                <Calendar className="h-6 w-6" />
                <span className="text-xs mt-1">Calendars</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="min-w-[120px]">
              <DropdownMenuItem 
                onClick={() => handleNavigation("/dashboard/weekly")}
                className="flex items-center justify-center gap-2 py-3 relative"
              >
                <div className="relative">
                  <CalendarDays className="h-7 w-7" />
                  <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm font-bold">
                    W
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleNavigation("/dashboard?view=calendar")}
                className="flex items-center justify-center gap-2 py-3 relative"
              >
                <div className="relative">
                  <Calendar className="h-7 w-7" />
                  <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm font-bold">
                    M
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button 
            className="flex flex-col items-center p-2 text-[#D946EF]"
            onClick={() => handleNavigation("/notes")}
          >
            <FileText className="h-6 w-6" />
            <span className="text-xs mt-1">Notes</span>
          </button>
          <button 
            className={cn(
              "flex flex-col items-center p-2",
              isChatOpen ? "text-[#33C3F0]" : "text-gray-500 hover:text-[#33C3F0]"
            )}
            onClick={handleChatToggle}
          >
            <MessageSquare className="h-6 w-6" />
            <span className="text-xs mt-1">Chat</span>
          </button>
          <button 
            className="flex flex-col items-center p-2 text-[#ea384c]"
            onClick={() => handleNavigation("/self-care")}
          >
            <Heart className="h-6 w-6" />
            <span className="text-xs mt-1">Self-Care</span>
          </button>
        </div>
      </div>
      <ChatBubble isOpen={isChatOpen} onOpenChange={setIsChatOpen} />
    </>
  );
}
