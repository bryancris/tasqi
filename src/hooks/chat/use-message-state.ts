
import { useState } from "react";
import { Message } from "@/components/chat/types";

export function useMessageState() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  // Add user message to messages array
  const addUserMessage = (content: string) => {
    const userMessage = { content, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    return userMessage;
  };

  // Add AI message to messages array
  const addAIMessage = (content: string) => {
    const aiMessage = { content, isUser: false };
    setMessages(prev => [...prev, aiMessage]);
    return aiMessage;
  };

  // Add temporary loading message
  const addLoadingMessage = () => {
    const tempAiMessage = { content: "...", isUser: false };
    setMessages(prev => [...prev, tempAiMessage]);
  };

  // Remove the last message (usually the loading indicator)
  const removeLastMessage = () => {
    setMessages(prev => prev.slice(0, -1));
  };

  // Reset all chat messages
  const resetMessages = () => {
    setMessages([]);
  };

  return {
    message,
    messages,
    setMessage,
    addUserMessage,
    addAIMessage,
    addLoadingMessage,
    removeLastMessage,
    resetMessages,
    setMessages
  };
}
