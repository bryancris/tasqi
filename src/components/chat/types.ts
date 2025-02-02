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

export interface ChatInputProps {
  message: string;
  onMessageChange: (message: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export interface ChatDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  messages: Message[];
  isLoading: boolean;
  onMessageChange: (message: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export interface MobileChatViewProps {
  onClose: () => void;
  message: string;
  messages: Message[];
  isLoading: boolean;
  onMessageChange: (message: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}