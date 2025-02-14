
import { format } from "date-fns";
import { HeaderUserMenu } from "@/components/dashboard/header/HeaderUserMenu";
import { Plus, AlarmClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddTaskDrawer } from "@/components/dashboard/AddTaskDrawer";

export function MobileHeader() {
  const currentTime = format(new Date(), 'HH:mm');
  const currentDate = format(new Date(), 'EEE, MMM d');

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-[#F2FCE2] via-[#E5DEFF] to-[#D3E4FD] border-b p-4 z-50 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#6366F1] text-2xl font-semibold">TasqiAI</h1>
          <p className="text-sm text-[#333333]">{currentTime} {currentDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-[#6366F1]">
            <AlarmClock className="h-5 w-5" />
          </Button>
          <AddTaskDrawer>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 rounded-full opacity-75 group-hover:opacity-100 animate-spin"></div>
              <Button 
                variant="ghost" 
                size="icon"
                className="relative h-10 w-10 bg-[#9B87F5] hover:bg-[#8B5CF6] transition-all duration-300 rounded-full transform hover:scale-110"
              >
                <Plus className="h-5 w-5 text-white" />
              </Button>
            </div>
          </AddTaskDrawer>
          <HeaderUserMenu />
        </div>
      </div>
    </div>
  );
}
