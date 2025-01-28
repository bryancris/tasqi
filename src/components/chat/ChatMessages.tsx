import { ChatMessagesProps } from "./types";

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
      {messages.map((msg, index) => (
        <div key={index} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
          <div className={`rounded-lg p-3 max-w-[80%] ${
            msg.isUser 
              ? 'bg-blue-600 text-white' 
              : 'bg-white shadow-sm'
          }`}>
            <p className="text-sm">{msg.content}</p>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <p className="text-sm">Thinking...</p>
          </div>
        </div>
      )}
    </div>
  );
}