import { useQueryClient } from "@tanstack/react-query";
import { ProcessChatResponse } from "./use-server-communication-core";

export function useResponseProcessing() {
  const queryClient = useQueryClient();

  // Process timer data in the response
  const processTimerData = (data: ProcessChatResponse): ProcessChatResponse => {
    if (data?.timer) {
      console.log('⏰ Timer data detected:', data.timer);
      // Force refresh of timer data with delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['timers'] });
      }, 300);
    }
    return data;
  };

  // Process task lists to keep them updated
  const refreshTaskLists = (delay: number = 500) => {
    setTimeout(() => {
      console.log('🔄 Refreshing task and notification lists');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-tasks'] });
    }, delay);
  };

  return {
    processTimerData,
    refreshTaskLists
  };
}
