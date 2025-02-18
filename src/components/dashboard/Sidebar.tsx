
import { AddTaskDrawer } from "./AddTaskDrawer";
import { CalendarSection } from "./sidebar/CalendarSection";
import { ToolsSection } from "./sidebar/ToolsSection";
import { BottomControls } from "./sidebar/BottomControls";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { HeaderTime } from "@/components/dashboard/header/HeaderTime";

interface SidebarProps {
  onViewChange?: (view: 'tasks' | 'calendar' | 'yearly' | 'weekly') => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function Sidebar({ onViewChange, selectedDate, onDateChange }: SidebarProps) {
  return (
    <div className="w-[280px] border-r bg-background h-screen flex flex-col">
      <div className="p-4 border-b">
        <HeaderTime />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <AddTaskDrawer>
          <Button
            className="w-full bg-[#2ECC71] hover:bg-[#27AE60] text-white mb-4"
          >
            + Add a task
          </Button>
        </AddTaskDrawer>
        <div className="mt-6">
          <CalendarSection onViewChange={onViewChange} />
        </div>
        <ToolsSection />
        
        <div className="mt-auto pt-4">
          <div className="w-[200px]">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateChange(date)}
              className="w-full"
            />
          </div>
          <BottomControls />
        </div>
      </div>
    </div>
  );
}
