
import { useCallback } from "react";
import { ErrorHandlingHelpers } from "./types";

export function useErrorHandling({
  removeLastMessage,
  addAIMessage
}: ErrorHandlingHelpers) {
  return useCallback((error: unknown, defaultMessage: string = "An error occurred") => {
    // Log the error for debugging
    console.error('❌ Error in chat process:', error);
    
    // Remove any loading indicators
    removeLastMessage();
    
    // Format the error message properly
    let errorMessage = defaultMessage;
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = String(error);
    }
    
    // Add error message as AI response
    addAIMessage(`Sorry, I encountered an error: ${errorMessage}`);
    
    return { errorMessage };
  }, [removeLastMessage, addAIMessage]);
}
