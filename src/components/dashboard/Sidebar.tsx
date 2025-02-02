import { AddTaskDrawer } from "./AddTaskDrawer";
import { CalendarSection } from "./sidebar/CalendarSection";
import { ToolsSection } from "./sidebar/ToolsSection";
import { BottomControls } from "./sidebar/BottomControls";
import { Calendar } from "@/components/ui/calendar";

interface SidebarProps {
  onViewChange?: (view: 'tasks' | 'calendar' | 'yearly' | 'weekly') => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function Sidebar({ onViewChange, selectedDate, onDateChange }: SidebarProps) {
  return (
    <div className="border-r bg-white w-[280px] h-screen flex flex-col">
      <div className="flex flex-col h-full">
        <div className="pt-6 px-4">
          <AddTaskDrawer />
        </div>
        
        <div className="px-4 mt-6 space-y-4 flex-1">
          <CalendarSection onViewChange={onViewChange} />
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
    </div>
  );
}