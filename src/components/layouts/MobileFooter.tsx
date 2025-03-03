
import { Home, Calendar, FileText, MessageSquare, Heart, CalendarDays } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useCalendarView } from "@/contexts/CalendarViewContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MobileFooter({ activePage }: { activePage?: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { view, setView } = useCalendarView();

  const handleDailyClick = () => {
    navigate('/dashboard/tasks');
    setView('tasks');
  };

  const handleWeeklyClick = () => {
    navigate('/dashboard/weekly');
    setView('weekly');
    setIsDropdownOpen(false);
  };

  const handleMonthlyClick = () => {
    navigate('/dashboard/monthly');
    setView('monthly');
    setIsDropdownOpen(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#F1F0FB] via-[#E5DEFF] to-[#F1F0FB] border-t py-2 px-4 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center">
        <button
          onClick={handleDailyClick}
          className={cn(
            "flex flex-col items-center p-2",
            location.pathname.startsWith('/dashboard') && view === 'tasks' ? "text-[#F97316]" : "text-gray-500"
          )}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1">Daily</span>
        </button>
        
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button 
              className={cn(
                "flex flex-col items-center p-2",
                (view === 'weekly' || view === 'monthly') ? "text-[#8B5CF6]" : "text-gray-500 hover:text-[#8B5CF6]"
              )}
            >
              <Calendar className="h-6 w-6" />
              <span className="text-xs mt-1">Calendars</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="min-w-[120px] bg-white border border-gray-100 shadow-lg p-0.5">
            <button
              onClick={handleWeeklyClick}
              className="flex items-center justify-center gap-2 py-1 relative hover:bg-gray-50 focus:bg-gray-50 w-full"
            >
              <div className="relative">
                <CalendarDays className="h-7 w-7 text-[#AAAAAA]" />
                <span className="absolute top-[55%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-[#8B5CF6]">
                  W
                </span>
              </div>
            </button>
            <button
              onClick={handleMonthlyClick}
              className="flex items-center justify-center gap-2 py-1 relative hover:bg-gray-50 focus:bg-gray-50 w-full"
            >
              <div className="relative">
                <Calendar className="h-7 w-7 text-[#AAAAAA]" />
                <span className="absolute top-[55%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-[#8B5CF6]">
                  M
                </span>
              </div>
            </button>
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

        <Link 
          to="/chat"
          className={cn(
            "flex flex-col items-center p-2",
            activePage === 'chat' || location.pathname === '/chat' || location.pathname === '/dashboard/chat' ? "text-[#33C3F0]" : "text-gray-500"
          )}
        >
          <MessageSquare className="h-6 w-6" />
          <span className="text-xs mt-1">Chat</span>
        </Link>

        <Link 
          to="/dashboard/self-care"
          className={cn(
            "flex flex-col items-center p-2",
            location.pathname === '/dashboard/self-care' ? "text-[#ea384c]" : "text-gray-500"
          )}
        >
          <Heart className="h-6 w-6" />
          <span className="text-xs mt-1">Self Care</span>
        </Link>
      </div>
    </div>
  );
}
