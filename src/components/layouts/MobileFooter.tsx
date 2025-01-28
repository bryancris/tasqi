import { Home, Calendar, FileText, MessageSquare, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChatBubble } from "@/components/chat/ChatBubble";

export function MobileFooter() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDaily = location.pathname === "/dashboard";
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t py-2 px-4 z-50">
        <div className="flex justify-between items-center">
          <button 
            className={cn(
              "flex flex-col items-center p-2",
              isDaily ? "text-[#6366F1]" : "text-gray-500"
            )}
            onClick={() => handleNavigation("/dashboard")}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">Daily</span>
          </button>
          <button 
            className="flex flex-col items-center p-2 text-gray-500"
            onClick={() => handleNavigation("/calendar")}
          >
            <Calendar className="h-6 w-6" />
            <span className="text-xs mt-1">Week</span>
          </button>
          <button 
            className="flex flex-col items-center p-2 text-gray-500"
            onClick={() => handleNavigation("/notes")}
          >
            <FileText className="h-6 w-6" />
            <span className="text-xs mt-1">Notes</span>
          </button>
          <button 
            className={cn(
              "flex flex-col items-center p-2",
              isChatOpen ? "text-[#6366F1]" : "text-gray-500"
            )}
            onClick={handleChatToggle}
          >
            <MessageSquare className="h-6 w-6" />
            <span className="text-xs mt-1">Chat</span>
          </button>
          <button 
            className="flex flex-col items-center p-2 text-gray-500"
            onClick={() => handleNavigation("/settings")}
          >
            <Settings className="h-6 w-6" />
            <span className="text-xs mt-1">Settings</span>
          </button>
        </div>
      </div>
      <ChatBubble isOpen={isChatOpen} onOpenChange={setIsChatOpen} />
    </>
  );
}