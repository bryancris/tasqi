
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useServerErrorHandling } from "./use-error-handling";

export interface ProcessChatResponse {
  response?: string;
  timer?: any;
  error?: Error;
  success?: boolean;
  taskCreated?: boolean;
  task?: any;
}

export function useServerCommunicationCore() {
  const queryClient = useQueryClient();
  const { handleServerError } = useServerErrorHandling();

  // Core function to invoke process-chat endpoint
  const invokeProcessChat = async (
    content: string, 
    userId: string
  ): Promise<ProcessChatResponse> => {
    const startTime = Date.now();
    
    try {
      console.log('Invoking process-chat with message:', content.substring(0, 50) + '...');
      
      const { data, error } = await supabase.functions.invoke('process-chat', {
        body: { message: content, userId }
      });
      
      const endTime = Date.now();
      console.log(`⏱️ Function invocation took ${endTime - startTime}ms`);
      console.log('📊 Full response data:', data);

      if (error) {
        console.error('❌ Function error:', error);
        throw error;
      }

      console.log('✅ Function returned data:', data);
      return data;
    } catch (error) {
      return handleServerError(error);
    }
  };

  return {
    invokeProcessChat,
    queryClient
  };
}
