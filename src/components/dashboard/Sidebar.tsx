
import { AddTaskDrawer } from "./AddTaskDrawer";
import { CalendarSection } from "./sidebar/CalendarSection";
import { ToolsSection } from "./sidebar/ToolsSection";
import { BottomControls } from "./sidebar/BottomControls";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { HeaderTime } from "@/components/dashboard/header/HeaderTime";
import { HeaderNotifications } from "@/components/dashboard/header/HeaderNotifications";
import { HeaderUserMenu } from "@/components/dashboard/header/HeaderUserMenu";

interface SidebarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function Sidebar({ selectedDate, onDateChange }: SidebarProps) {
  return (
    <div className="w-[280px] border-r bg-background h-screen flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <HeaderTime />
        <div className="flex items-center space-x-2">
          <HeaderNotifications />
          <HeaderUserMenu />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
        <AddTaskDrawer>
          <Button
            className="w-full bg-[#2ECC71] hover:bg-[#27AE60] text-white mb-4"
          >
            + Add a task
          </Button>
        </AddTaskDrawer>
        <div className="mt-6">
          <CalendarSection />
        </div>
        <ToolsSection />
        
        <div className="mt-auto pt-4">
          <div className="w-[200px]">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateChange(date)}
              className="w-full rounded-lg"
            />
          </div>
          <BottomControls />
        </div>
      </div>
    </div>
  );
}
