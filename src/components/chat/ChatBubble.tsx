import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function ChatBubble() {
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    // TODO: Handle message submission
    setMessage("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chat with AI Assistant</DialogTitle>
        </DialogHeader>
        <div className="flex h-[400px] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="flex justify-start">
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-sm">Hello! How can I help you today?</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button type="submit">Send</Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}