import { AddTaskDrawer } from "./AddTaskDrawer";
import { CalendarSection } from "./sidebar/CalendarSection";
import { ToolsSection } from "./sidebar/ToolsSection";
import { BottomControls } from "./sidebar/BottomControls";

interface SidebarProps {
  onViewChange?: (view: 'tasks' | 'calendar') => void;
}

export function Sidebar({ onViewChange }: SidebarProps) {
  return (
    <div className="border-r bg-[#F8F9FC] w-[240px] h-screen flex flex-col">
      <div className="p-4 space-y-4">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-semibold text-[#6366F1]">TasqiAI</h1>
        </div>
        <AddTaskDrawer />
        <CalendarSection onViewChange={onViewChange} />
        <ToolsSection />
        <BottomControls />
      </div>
    </div>
  );
}