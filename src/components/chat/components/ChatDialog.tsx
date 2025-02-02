import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChatHeader } from "../ChatHeader";
import { ChatMessages } from "../ChatMessages";
import { ChatInput } from "../ChatInput";

interface ChatDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  messages: any[];
  isLoading: boolean;
  onMessageChange: (message: string) => void;
  onSubmit: () => void;
}

export function ChatDialog({
  isOpen,
  onOpenChange,
  message,
  messages,
  isLoading,
  onMessageChange,
  onSubmit
}: ChatDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        hideCloseButton
        className="p-0 fixed bottom-20 right-4 mb-0 sm:max-w-[440px] rounded-xl"
      >
        <div className="flex flex-col h-[600px]">
          <ChatHeader onClose={() => onOpenChange(false)} />
          <ChatMessages messages={messages} isLoading={isLoading} />
          <ChatInput 
            message={message}
            onMessageChange={onMessageChange}
            onSubmit={onSubmit}
            isLoading={isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}