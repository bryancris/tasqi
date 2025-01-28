import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export function HeaderNotifications() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
    >
      <Bell className="h-5 w-5" />
      <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-600" />
    </Button>
  );
}