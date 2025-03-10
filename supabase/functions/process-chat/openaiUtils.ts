
import { ChatMessage, Task } from "./types.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/**
 * Generate an AI response based on the user's message and chat history
 */
export async function generateAIResponse(
  message: string,
  chatHistory: ChatMessage[],
  apiKey: string,
  userId: string
): Promise<string> {
  try {
    if (!apiKey) {
      console.error("Missing OpenAI API key");
      return "I'm having trouble connecting to my knowledge base right now. Please try again later.";
    }

    // Initialize the Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get user profile information if available
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
    }

    // Get relevant past conversations using vector similarity
    let relevantHistory: ChatMessage[] = [];
    try {
      // Only do similarity search if we have embeddings
      const hasEmbeddings = await checkIfTableHasEmbeddings(supabase);
      
      if (hasEmbeddings) {
        // Fetch embedding for the current message
        const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "text-embedding-3-small",
            input: message
          })
        });

        if (!embeddingResponse.ok) {
          throw new Error(`OpenAI API returned ${embeddingResponse.status}: ${await embeddingResponse.text()}`);
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        // Search for similar messages in the chat history
        const { data: similarMessages, error: similarError } = await supabase.rpc(
          'match_chat_messages',
          {
            query_embedding: embedding,
            match_threshold: 0.75,
            match_count: 5,
            user_id: userId
          }
        );

        if (similarError) {
          console.error("Error searching for similar messages:", similarError);
        } else if (similarMessages && similarMessages.length > 0) {
          console.log(`Found ${similarMessages.length} relevant messages from history`);
          
          // Convert to ChatMessage format
          relevantHistory = similarMessages.map((msg: any) => ({
            role: msg.is_ai ? 'assistant' : 'user',
            content: msg.content
          }));
        }
      } else {
        console.log("Embeddings not available for similarity search");
      }
    } catch (error) {
      console.error("Error in similarity search:", error);
      // Continue with regular processing if similarity search fails
    }

    // Create a persistent memory section for the system prompt
    let memorySection = "";
    if (profileData) {
      const userName = [profileData.first_name, profileData.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();

      if (userName) {
        memorySection += `The user's name is ${userName}. `;
      }
      
      if (profileData.email) {
        memorySection += `The user's email is ${profileData.email}. `;
      }
    }

    // Add relevant information from past conversations
    if (relevantHistory.length > 0) {
      memorySection += "Here are some relevant past exchanges to help maintain context:\n";
      relevantHistory.forEach((msg, i) => {
        if (i < 3) {  // Limit to most relevant 3 exchanges to save tokens
          memorySection += `${msg.role === 'user' ? 'User' : 'You'}: ${msg.content}\n`;
        }
      });
    }

    // Enhanced system prompt with memory
    const systemPrompt = `You are a helpful AI assistant in a task management app. Help the user manage their tasks, timers, and provide assistance.
                  Today's date is ${new Date().toISOString().split('T')[0]}.
                  Be concise in your responses. If the user asks to set a timer, asks about a timer, or wants to cancel a timer, inform them that you'll handle that request.
                  
                  MEMORY INFORMATION:
                  ${memorySection}
                  
                  IMPORTANT: Be proactive about creating tasks. If a user message mentions any activity that could be a task, like "I need to go to Walmart" or "Remember to call mom", 
                  ALWAYS respond by CONFIRMING you've created a task. Use phrases like "I've created a task for you to..." or "I've added that to your tasks."
                  
                  Never respond with uncertain language like "Would you like me to create a task?" Instead, be decisive and create the task.`;

    // Build messages array for OpenAI
    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory,
      { role: "user", content: message }
    ];

    console.log("Sending enhanced prompt to OpenAI with memory section");

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
    
    // Also store the embedding for this user message for future reference
    try {
      // Only attempt to store an embedding if we successfully queried them earlier
      if (hasEmbeddings) {
        storeMessageWithEmbedding(supabase, message, userId, apiKey);
      }
    } catch (embeddingError) {
      console.error("Error storing message embedding:", embeddingError);
      // Continue even if embedding storage fails
    }
    
    return assistantResponse;
  } catch (error) {
    console.error("Error in OpenAI processing:", error);
    return "I'm having trouble connecting right now. Please try again later.";
  }
}

/**
 * Check if the chat_messages table has the embedding column with data
 */
async function checkIfTableHasEmbeddings(supabase: any): Promise<boolean> {
  try {
    // Query a single row to check if embedding column exists and has data
    const { data, error } = await supabase
      .from('chat_messages')
      .select('embedding')
      .limit(1);
    
    if (error) {
      console.error("Error checking embeddings:", error);
      return false;
    }
    
    return data && data.length > 0 && data[0].embedding !== null;
  } catch (error) {
    console.error("Error checking for embeddings column:", error);
    return false;
  }
}

/**
 * Store a user message with its embedding for future similarity search
 */
async function storeMessageWithEmbedding(
  supabase: any, 
  content: string, 
  userId: string, 
  apiKey: string
): Promise<void> {
  try {
    // Generate embedding for this message
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: content
      })
    });

    if (!embeddingResponse.ok) {
      throw new Error(`Embedding API returned ${embeddingResponse.status}: ${await embeddingResponse.text()}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    // Update the message with its embedding
    const { error } = await supabase
      .from('chat_messages')
      .update({ embedding: embedding })
      .eq('user_id', userId)
      .eq('content', content)
      .is('is_ai', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error updating message with embedding:", error);
    } else {
      console.log("Successfully stored message embedding");
    }
  } catch (error) {
    console.error("Error in storeMessageWithEmbedding:", error);
    // Let the error propagate up
    throw error;
  }
}
