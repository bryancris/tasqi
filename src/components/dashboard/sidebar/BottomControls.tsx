import { ChatBubble } from "@/components/chat/ChatBubble";

export function BottomControls() {
  return (
    <div className="mt-auto p-4 flex items-center gap-2">
      <ChatBubble variant="sidebar" />
    </div>
  );
}