
// Simple implementation for demo purposes
// In a real app, this would connect to OpenAI API
export async function generateResponse(message: string): Promise<string> {
  // For demo purposes, return a simple response
  const responses = [
    "I understand you'd like assistance with that. How can I help you manage this task?",
    "That's an interesting topic. Would you like me to create a task for this?",
    "I'm here to help you stay organized. What would you like me to do with this information?",
    "Thanks for sharing that. Would you like me to schedule this for you?",
    "I appreciate you letting me know. Is there anything specific you'd like me to do with this information?"
  ];
  
  // Random selection for demo
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}

// Check if a message appears to be a task creation request
export function isTaskCreationRequest(message: string): boolean {
  // Common phrases that might indicate a task creation request
  const taskCreationPhrases = [
    'add task', 'create task', 'make task', 'new task',
    'add a task', 'create a task', 'schedule task', 'schedule a task',
    'remind me to', 'i need to', 'schedule an appointment', 'add appointment',
    'set up meeting', 'schedule meeting'
  ];
  
  return taskCreationPhrases.some(phrase => message.toLowerCase().includes(phrase));
}
