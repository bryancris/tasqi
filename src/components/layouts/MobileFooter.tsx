
import { Home, Calendar, FileText, MessageSquare, Heart, CalendarDays } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { useCalendarView } from "@/hooks/use-calendar-view";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MobileFooter() {
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { view, changeView } = useCalendarView();

  const handleChatToggle = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#F1F0FB] via-[#E5DEFF] to-[#F1F0FB] border-t py-2 px-4 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center">
          <Link 
            to="/dashboard"
            onClick={() => changeView('tasks')}
            className={cn(
              "flex flex-col items-center p-2",
              view === 'tasks' ? "text-[#F97316]" : "text-gray-500"
            )}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">Daily</span>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className={cn(
                  "flex flex-col items-center p-2",
                  (view === 'weekly' || view === 'calendar') ? "text-[#8B5CF6]" : "text-gray-500 hover:text-[#8B5CF6]"
                )}
              >
                <Calendar className="h-6 w-6" />
                <span className="text-xs mt-1">Calendars</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="min-w-[120px] bg-transparent border-none shadow-none">
              <DropdownMenuItem 
                onClick={() => {
                  changeView('weekly');
                }}
                className="flex items-center justify-center gap-2 py-3 relative hover:bg-transparent focus:bg-transparent"
              >
                <Link to="/dashboard/weekly" className="relative">
                  <CalendarDays className="h-7 w-7 text-[#AAAAAA]" />
                  <span className="absolute top-[55%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-[#8B5CF6]">
                    W
                  </span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  changeView('calendar');
                }}
                className="flex items-center justify-center gap-2 py-3 relative hover:bg-transparent focus:bg-transparent"
              >
                <Link to="/dashboard" className="relative">
                  <Calendar className="h-7 w-7 text-[#AAAAAA]" />
                  <span className="absolute top-[55%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-[#8B5CF6]">
                    M
                  </span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link 
            to="/notes"
            className={cn(
              "flex flex-col items-center p-2",
              location.pathname === '/notes' ? "text-[#D946EF]" : "text-gray-500"
            )}
          >
            <FileText className="h-6 w-6" />
            <span className="text-xs mt-1">Notes</span>
          </Link>

          <button 
            onClick={handleChatToggle}
            className={cn(
              "flex flex-col items-center p-2",
              isChatOpen ? "text-[#33C3F0]" : "text-gray-500 hover:text-[#33C3F0]"
            )}
          >
            <MessageSquare className="h-6 w-6" />
            <span className="text-xs mt-1">Chat</span>
          </button>

          <Link 
            to="/self-care"
            className={cn(
              "flex flex-col items-center p-2",
              location.pathname === '/self-care' ? "text-[#ea384c]" : "text-gray-500"
            )}
          >
            <Heart className="h-6 w-6" />
            <span className="text-xs mt-1">Self-Care</span>
          </Link>
        </div>
      </div>
      <ChatBubble isOpen={isChatOpen} onOpenChange={setIsChatOpen} />
    </>
  );
}
