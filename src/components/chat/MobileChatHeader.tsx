import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileChatHeaderProps {
  onClose: () => void;
}

export function MobileChatHeader({ onClose }: MobileChatHeaderProps) {
  return (
    <div className="flex items-start justify-between p-4 border-b bg-white">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 text-xl">AI</span>
        </div>
        <div>
          <h2 className="text-base font-medium">AI Assistant</h2>
          <p className="text-sm text-muted-foreground">Here to help manage your tasks</p>
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 hover:bg-gray-100"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}