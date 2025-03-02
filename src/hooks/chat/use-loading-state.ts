
import { useState } from "react";

export function useLoadingState() {
  const [isLoading, setIsLoading] = useState(false);
  
  return {
    isLoading,
    setIsLoading
  };
}
