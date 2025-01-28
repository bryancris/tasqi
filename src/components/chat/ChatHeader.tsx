import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChatHeaderProps } from "./types";

export function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
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
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 hover:bg-gray-100"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </DialogTrigger>
    </div>
  );
}