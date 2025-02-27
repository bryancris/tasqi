
import { MobileChatHeader } from "../MobileChatHeader";
import { ChatMessages } from "../ChatMessages";
import { ChatInput } from "../ChatInput";
import { MobileChatViewProps } from "../types";

export function MobileChatView({
  onClose,
  message,
  messages,
  isLoading,
  onMessageChange,
  onSubmit
}: MobileChatViewProps) {
  return (
    <div className="fixed left-0 right-0 pointer-events-none z-40" 
         style={{ top: '72px', bottom: '80px' }}>
      <div className="flex flex-col h-full bg-background pointer-events-auto">
        <MobileChatHeader onClose={onClose} />
        <ChatMessages messages={messages} isLoading={isLoading} />
        <ChatInput 
          message={message}
          onMessageChange={onMessageChange}
          onSubmit={onSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
