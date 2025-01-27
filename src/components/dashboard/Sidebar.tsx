import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { 
  CalendarDays, 
  PenLine, 
  BarChart2, 
  Zap,
  Volume2,
  Settings
} from "lucide-react";
import { useState } from "react";
import { AddTaskDrawer } from "./AddTaskDrawer";

export function Sidebar() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="border-r bg-[#F8F9FC] w-[240px] h-screen p-4 flex flex-col">
      <div className="space-y-4">
        {/* Add Task Button */}
        <AddTaskDrawer />

        {/* Calendar View Section */}
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-[#6B7280] hover:text-[#374151] hover:bg-[#E5E7EB]"
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Calendar View
          </Button>

          {/* View Options */}
          <div className="pl-8 space-y-1">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-sm bg-[#D1FAE5] text-[#059669] hover:bg-[#A7F3D0]"
            >
              Daily
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-sm text-[#6B7280] hover:bg-[#E5E7EB]"
            >
              Weekly
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-sm text-[#6B7280] hover:bg-[#E5E7EB]"
            >
              Monthly
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-sm text-[#6B7280] hover:bg-[#E5E7EB]"
            >
              Yearly
            </Button>
          </div>
        </div>

        {/* Tools Section */}
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-[#9333EA] hover:bg-[#E5E7EB]"
          >
            <PenLine className="mr-2 h-4 w-4" />
            Notes
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-[#6B7280] hover:bg-[#E5E7EB]"
          >
            <BarChart2 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-[#EA580C] hover:bg-[#E5E7EB]"
          >
            <Zap className="mr-2 h-4 w-4" />
            Habit Tracking
          </Button>
        </div>

        {/* Bottom Controls */}
        <div className="flex justify-between px-2 mt-4">
          <Button variant="ghost" size="icon" className="text-[#6B7280]">
            <Volume2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-[#6B7280]">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Widget */}
        <div className="mt-4 -mx-2">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border-[1.5px] border-gray-300 scale-75 origin-top"
          />
        </div>
      </div>
    </div>
  );
}
