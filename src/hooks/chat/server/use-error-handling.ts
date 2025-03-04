
import { useQueryClient } from "@tanstack/react-query";

export function useServerErrorHandling() {
  // Handle server errors, particularly network and CORS issues
  const handleServerError = (error: any): never => {
    // Handle CORS and network errors
    if (
      (error instanceof TypeError && error.message === 'Failed to fetch') ||
      (error as any)?.message?.includes('CORS') ||
      ((error as any).cause instanceof TypeError && (error as any).cause.message === 'Failed to fetch')
    ) {
      console.error('❌ CORS or network error detected:', error);
      throw new Error("The server is currently unavailable. Please try again later.");
    } else {
      console.error('❌ Error invoking function:', error);
      throw error;
    }
  };

  return {
    handleServerError
  };
}
