import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, BarChart2, BookMarked, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  return (
    <div className="border-r bg-sidebar w-[240px] h-screen p-4">
      <div className="space-y-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">TasqiAI</h2>
          <Button className="w-full justify-start" variant="secondary">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Calendar View
          </Button>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-sm font-semibold">Tools</h2>
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start">
              <BookMarked className="mr-2 h-4 w-4" />
              Notes
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <BarChart2 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}