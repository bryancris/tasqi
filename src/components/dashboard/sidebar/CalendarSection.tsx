import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays } from "lucide-react";
import { useState } from "react";

export function CalendarSection() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="space-y-2">
      <Button 
        variant="ghost" 
        className="w-full justify-start text-[#6B7280] hover:text-[#374151] hover:bg-[#E5E7EB]"
      >
        <CalendarDays className="mr-2 h-4 w-4" />
        Calendar View
      </Button>

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

      <div className="mt-4 -mx-2">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border-[1.5px] border-gray-300 scale-75 origin-top"
        />
      </div>
    </div>
  );
}