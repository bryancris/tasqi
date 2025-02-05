import { ChatMessagesProps } from "./types";

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#F1F0FB] to-[#E5DEFF]">
      {messages.map((msg, index) => (
        <div key={index} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
          <div className={`rounded-2xl p-3 max-w-[80%] ${
            msg.isUser 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'bg-white shadow-md backdrop-blur-sm bg-opacity-90'
          }`}>
            <p className={`text-sm ${msg.isUser ? 'text-white' : 'text-gray-800'}`}>{msg.content}</p>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="rounded-2xl bg-white p-3 shadow-md backdrop-blur-sm bg-opacity-90">
            <p className="text-sm text-gray-800">Thinking...</p>
          </div>
        </div>
      )}
    </div>
  );
}