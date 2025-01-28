import { AddTaskDrawer } from "./AddTaskDrawer";
import { CalendarSection } from "./sidebar/CalendarSection";
import { ToolsSection } from "./sidebar/ToolsSection";
import { BottomControls } from "./sidebar/BottomControls";

interface SidebarProps {
  onViewChange?: (view: 'tasks' | 'calendar') => void;
}

export function Sidebar({ onViewChange }: SidebarProps) {
  return (
    <div className="border-r bg-white w-[240px] h-screen flex flex-col">
      <div className="p-4 flex flex-col h-full">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-6">
            <h1 className="text-xl font-semibold text-[#6366F1]">TasqiAI</h1>
          </div>
          <AddTaskDrawer />
          <ToolsSection />
        </div>
        
        <div className="flex-1" />
        
        <div className="space-y-4">
          <CalendarSection onViewChange={onViewChange} />
          <BottomControls />
        </div>
      </div>
    </div>
  );
}