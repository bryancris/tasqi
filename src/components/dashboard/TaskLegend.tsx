
import { Share2, Bell, Users, Mic } from "lucide-react";

export function TaskLegend() {
  return (
    <div className="mb-4 flex items-center gap-4 text-xs text-gray-600">
      <div className="flex items-center gap-1">
        <div className="w-2 h-4 bg-[#8B5CF6] rounded"></div>
        <span>Shared Task</span>
      </div>
      <div className="flex items-center gap-1">
        <Mic className="w-3 h-3" />
        <span>Voice Note</span>
      </div>
      <div className="flex items-center gap-1">
        <Bell className="w-3 h-3" />
        <span>Alert Set</span>
      </div>
      <div className="flex items-center gap-1">
        <Users className="w-3 h-3" />
        <span>Group Task</span>
      </div>
    </div>
  );
}
