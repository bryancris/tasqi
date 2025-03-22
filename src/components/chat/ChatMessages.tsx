
import { ChatMessagesProps } from "./types";
import { useEffect, useRef } from "react";

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change or when loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div 
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#F1F0FB] to-[#E5DEFF] h-full"
    >
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
      {/* This empty div serves as a scroll target */}
      <div ref={messagesEndRef} className="h-4" />
    </div>
  );
}
