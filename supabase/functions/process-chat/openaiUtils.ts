
import { ChatMessage, Task } from "./types.ts";

/**
 * Generate an AI response based on the user's message and chat history
 */
export async function generateAIResponse(
  message: string,
  chatHistory: ChatMessage[],
  apiKey: string
): Promise<string> {
  try {
    if (!apiKey) {
      console.error("Missing OpenAI API key");
      return "I'm having trouble connecting to my knowledge base right now. Please try again later.";
    }

    // Build messages array for OpenAI
    const messages = [
      {
        role: "system",
        content: `You are a helpful AI assistant in a task management app. Help the user manage their tasks, timers, and provide assistance.
                  Today's date is ${new Date().toISOString().split('T')[0]}.
                  Be concise in your responses. If the user asks to set a timer, asks about a timer, or wants to cancel a timer, inform them that you'll handle that request.
                  
                  IMPORTANT: Be proactive about creating tasks. If a user message mentions any activity that could be a task, like "I need to go to Walmart" or "Remember to call mom", 
                  ALWAYS respond by CONFIRMING you've created a task. Use phrases like "I've created a task for you to..." or "I've added that to your tasks."
                  
                  Never respond with uncertain language like "Would you like me to create a task?" Instead, be decisive and create the task.`
      },
      ...chatHistory,
      { role: "user", content: message }
    ];

    // Make request to OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return "I'm having trouble generating a response right now. Please try again later.";
    }

    // Extract and return the assistant's message
    const assistantResponse = data.choices[0]?.message?.content || 
      "I'm having trouble understanding right now. Could you rephrase that?";
    
    return assistantResponse;
  } catch (error) {
    console.error("Error in OpenAI processing:", error);
    return "I'm having trouble connecting right now. Please try again later.";
  }
}
