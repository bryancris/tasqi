
import { useToast } from "@/components/ui/use-toast";
import { Message } from "@/components/chat/types";
import { useQueryClient } from "@tanstack/react-query";
import { useMessageState } from "./use-message-state";
import { useLoadingState } from "./use-loading-state";
import { useNetworkDetection } from "./use-network-detection";
import { useChatProcessing } from "./use-chat-processing";

export function useChatMessaging() {
  // Use the smaller, focused hooks
  const messageState = useMessageState();
  const { isLoading, setIsLoading } = useLoadingState();
  const { isNetworkAvailable } = useNetworkDetection();
  const { processMessage } = useChatProcessing();
  
  const { toast: shadowToast } = useToast();
  const queryClient = useQueryClient();

  return {
    ...messageState,
    isLoading,
    processMessage,
    setIsLoading,
    shadowToast,
    queryClient,
    isNetworkAvailable
  };
}
