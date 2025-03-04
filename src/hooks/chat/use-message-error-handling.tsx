
import { useCallback } from "react";

export function useMessageErrorHandling() {
  const handleNetworkError = useCallback((error: any) => {
    // Handle CORS and network errors
    if (
      (error instanceof TypeError && error.message === 'Failed to fetch') ||
      error?.message?.includes('CORS') ||
      (error.cause instanceof TypeError && error.cause.message === 'Failed to fetch')
    ) {
      console.error('❌ CORS or network error detected:', error);
      return new Error("The server is currently unavailable. Please try again later.");
    } else {
      console.error('❌ Error processing message:', error);
      
      // Convert any error to an Error instance to ensure we have a message property
      if (!(error instanceof Error)) {
        if (typeof error === 'string') {
          return new Error(error);
        } else if (typeof error === 'object' && error !== null) {
          return new Error(String(error));
        } else {
          return new Error("Unknown error occurred");
        }
      }
      
      return error;
    }
  }, []);

  return {
    handleNetworkError
  };
}
