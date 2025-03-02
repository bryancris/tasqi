
import { useCallback } from "react";
import { useDebouncedRefresh } from "./use-debounced-refresh";
import { useTimerManagement } from "./use-timer-management";
import { useResponseHandling } from "./use-response-handling";

export function useChatNotifications() {
  // Use extracted hooks
  const { debouncedRefresh, isMountedRef } = useDebouncedRefresh();
  const { handleTimerResponse, timerPhrasesDetectedRef } = useTimerManagement(debouncedRefresh, isMountedRef);
  const { handleTimerRelatedResponse } = useResponseHandling(isMountedRef, timerPhrasesDetectedRef);

  const refreshLists = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    console.log('🔄 Refreshing task and notification lists');
    
    debouncedRefresh(['tasks'], 500);
    debouncedRefresh(['notifications'], 800);
    debouncedRefresh(['timers'], 1000);
  }, [debouncedRefresh, isMountedRef]);

  return {
    handleTimerResponse,
    handleTimerRelatedResponse,
    refreshLists
  };
}
