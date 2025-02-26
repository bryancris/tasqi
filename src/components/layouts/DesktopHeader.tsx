
import { HeaderNotifications } from "@/components/dashboard/header/HeaderNotifications";
import { HeaderUserMenu } from "@/components/dashboard/header/HeaderUserMenu";
import { Button } from "@/components/ui/button";
import { Timer } from "lucide-react";
import { useState } from "react";
import { TimerDialog } from "@/components/timer/TimerDialog";

export function DesktopHeader() {
  const [isTimerOpen, setIsTimerOpen] = useState(false);

  return (
    <div className="absolute top-0 right-0 p-4 flex items-center gap-2 z-10">
      <Button variant="ghost" size="icon" onClick={() => setIsTimerOpen(true)}>
        <Timer className="h-5 w-5" />
      </Button>
      <TimerDialog isOpen={isTimerOpen} onOpenChange={setIsTimerOpen} />
      <HeaderNotifications />
      <HeaderUserMenu />
    </div>
  );
}
