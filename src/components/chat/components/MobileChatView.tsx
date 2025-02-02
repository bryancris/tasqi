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
    <div className="fixed inset-0 bg-background" style={{ top: '72px', bottom: '80px' }}>
      <div className="flex flex-col h-full">
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