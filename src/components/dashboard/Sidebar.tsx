import { AddTaskDrawer } from "./AddTaskDrawer";
import { CalendarSection } from "./sidebar/CalendarSection";
import { ToolsSection } from "./sidebar/ToolsSection";
import { BottomControls } from "./sidebar/BottomControls";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";

interface SidebarProps {
  onViewChange?: (view: 'tasks' | 'calendar') => void;
}

export function Sidebar({ onViewChange }: SidebarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="border-r bg-white w-[240px] h-screen flex flex-col">
      <div className="p-4 flex flex-col h-full">
        <div className="space-y-4">
          <AddTaskDrawer />
          <CalendarSection onViewChange={onViewChange} />
          <ToolsSection />
        </div>
        
        <div className="flex-1" />
        
        <div className="space-y-4">
          <div className="border rounded-lg">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="w-full"
            />
          </div>
          <BottomControls />
        </div>
      </div>
    </div>
  );
}