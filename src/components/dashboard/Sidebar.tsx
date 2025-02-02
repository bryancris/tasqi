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
      <div className="pt-2 px-4 flex flex-col h-full">
        <div className="mb-4">
          <AddTaskDrawer />
        </div>
        
        <div className="space-y-4">
          <CalendarSection onViewChange={onViewChange} />
          <ToolsSection />
        </div>
        
        <div className="flex-1" />
        
        <div className="space-y-4 pb-4">
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