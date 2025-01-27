import { AddTaskDrawer } from "./AddTaskDrawer";
import { CalendarSection } from "./sidebar/CalendarSection";
import { ToolsSection } from "./sidebar/ToolsSection";
import { BottomControls } from "./sidebar/BottomControls";

export function Sidebar() {
  return (
    <div className="border-r bg-[#F8F9FC] w-[240px] h-screen p-4 flex flex-col">
      <div className="space-y-4">
        <AddTaskDrawer />
        <CalendarSection />
        <ToolsSection />
        <BottomControls />
      </div>
    </div>
  );
}