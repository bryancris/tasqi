export interface Message {
  content: string;
  isUser: boolean;
}

export interface ChatHeaderProps {
  onClose: () => void;
}

export interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}