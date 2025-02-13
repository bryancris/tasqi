
import { Share2, ArrowRight, Users } from "lucide-react";

export function TaskLegend() {
  return (
    <div className="flex items-center gap-6 mb-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Share2 className="w-4 h-4" />
        <span>Shared with me</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <ArrowRight className="w-4 h-4" />
        <span>Assigned to one</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Users className="w-4 h-4" />
        <span>Multiple assignees</span>
      </div>
    </div>
  );
}
