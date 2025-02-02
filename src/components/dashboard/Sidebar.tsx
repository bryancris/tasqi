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
        <div className="px-4 pt-20">
          <AddTaskDrawer />
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
    </div>
  );
}