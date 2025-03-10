
import { ProcessChatResponse } from "./use-server-communication-core";
import { useQueryClient } from "@tanstack/react-query";

export function useResponseProcessing() {
  const queryClient = useQueryClient();

  const processTimerData = (responseData: ProcessChatResponse): ProcessChatResponse => {
    // If we have timer data, process it
    if (responseData.timer) {
      console.log('Processing timer data:', responseData.timer);
      
      // Here we could integrate with local timer management
      // for enhanced offline capabilities
    }
    
    return responseData;
  };

  const refreshTaskLists = () => {
    setTimeout(() => {
      console.log('Refreshing task lists');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-tasks'] });
    }, 500);
  };
  
  // New function to process embeddings locally if needed
  const processEmbeddingsOffline = async (content: string): Promise<number[]> => {
    // This is a simple fallback when server-side embeddings are unavailable
    // It creates a basic term frequency vector as a primitive embedding
    
    // In a real implementation, you might want to use a local ML model
    // or a more sophisticated algorithm, but this provides a basic fallback
    
    // Tokenize and normalize
    const tokens = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(token => token.length > 1);
      
    // Count term frequencies
    const termFreq: Record<string, number> = {};
    tokens.forEach(token => {
      termFreq[token] = (termFreq[token] || 0) + 1;
    });
    
    // Create vector (only works with a fixed vocabulary but serves as example)
    const commonTerms = [
      'task', 'remind', 'meeting', 'call', 'email', 'work', 'home', 
      'family', 'friend', 'important', 'urgent', 'later', 'today', 
      'tomorrow', 'next', 'schedule', 'appointment', 'project'
    ];
    
    // Build a simple embedding vector based on term frequencies
    const vector = commonTerms.map(term => termFreq[term] || 0);
    
    // Normalize the vector (L2 norm)
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    const normalized = vector.map(val => val / magnitude);
    
    // Pad to fixed length (1536 is OpenAI's dimension)
    const padded = [...normalized];
    while (padded.length < 1536) {
      padded.push(0);
    }
    
    return padded;
  };

  return {
    processTimerData,
    refreshTaskLists,
    processEmbeddingsOffline
  };
}
