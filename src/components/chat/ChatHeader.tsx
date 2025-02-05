import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChatHeaderProps } from "./types";

export function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <div className="flex items-start justify-between p-4 bg-gradient-to-r from-[#E5DEFF] to-[#F1F0FB] rounded-t-xl border-b border-purple-100">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xl font-semibold">AI</span>
        </div>
        <div>
          <DialogTitle className="text-base font-medium text-gray-800">AI Assistant</DialogTitle>
          <p className="text-sm text-gray-600">Here to help manage your tasks</p>
        </div>
      </div>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 hover:bg-purple-100/50 rounded-full"
          onClick={onClose}
        >
          <X className="h-4 w-4 text-gray-600" />
        </Button>
      </DialogTrigger>
    </div>
  );
}