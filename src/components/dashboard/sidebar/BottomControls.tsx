import { Settings, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatBubble } from "@/components/chat/ChatBubble";

export function BottomControls() {
  return (
    <div className="mt-auto p-4 flex items-center gap-2">
      <ChatBubble variant="sidebar" />
      <Button variant="ghost" size="icon" className="text-muted-foreground">
        <Settings className="h-5 w-5" />
      </Button>
    </div>
  );
}