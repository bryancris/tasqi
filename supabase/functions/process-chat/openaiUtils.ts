
export async function generateResponse(message: string): Promise<string> {
  // For now, use predefined responses until we integrate with OpenAI API
  const phrases = [
    "I'll help you manage that task.",
    "Let me know if you need anything else with your tasks.",
    "I'm here to assist with your task management.",
    "Your productivity is my priority.",
    "I've processed your request. Anything else you need?",
    "I understand. Is there anything specific you'd like to know about your tasks?",
    "I'll take care of that for you.",
    "Consider it done!"
  ];
  
  return phrases[Math.floor(Math.random() * phrases.length)];
}

export function isTaskCreationRequest(message: string): boolean {
  // Simple heuristic to identify task creation requests
  const taskCreationPhrases = [
    "add task",
    "create task",
    "new task",
    "remind me to",
    "need to",
    "have to",
    "got to",
    "gotta",
    "should",
    "i will",
    "i'll",
  ];
  
  const lowerMessage = message.toLowerCase();
  
  // Exclude patterns that commonly appear in questions
  if (lowerMessage.includes("?") || 
      lowerMessage.startsWith("how") || 
      lowerMessage.startsWith("what") || 
      lowerMessage.startsWith("when") || 
      lowerMessage.startsWith("why") || 
      lowerMessage.startsWith("where") || 
      lowerMessage.startsWith("who") || 
      lowerMessage.startsWith("can you")) {
    return false;
  }
  
  // Check for common task creation phrases
  return taskCreationPhrases.some(phrase => lowerMessage.includes(phrase));
}
