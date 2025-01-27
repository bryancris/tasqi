import { Button } from "@/components/ui/button";
import { Volume2, Settings } from "lucide-react";

export function BottomControls() {
  return (
    <div className="flex justify-between px-2 mt-4">
      <Button variant="ghost" size="icon" className="text-[#6B7280]">
        <Volume2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="text-[#6B7280]">
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
}