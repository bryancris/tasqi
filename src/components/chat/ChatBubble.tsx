import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { ChatInput } from "./ChatInput";

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
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
        >
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-xl">AI</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="fixed bottom-[4.5rem] right-4 mb-0 p-0 sm:max-w-[440px] rounded-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 origin-bottom-right">
        <div className="flex h-[600px] flex-col">
          {/* Header */}
          <div className="flex items-start justify-between p-4 border-b bg-white rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xl">AI</span>
              </div>
              <div>
                <DialogTitle className="text-base font-medium">AI Assistant</DialogTitle>
                <p className="text-sm text-muted-foreground">Here to help manage your tasks</p>
              </div>
            </div>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            <div className="flex justify-start">
              <div className="rounded-lg bg-white p-3 max-w-[80%] shadow-sm">
                <p className="text-sm">Hello! How can I help you today?</p>
              </div>
            </div>
          </div>

          <ChatInput 
            message={message}
            onMessageChange={setMessage}
            onSubmit={handleSubmit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}