
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { ChatMessage, TimerData, TimerIntent } from "./types.ts";
import { parseTimerIntent, cancelTimer, checkTimerStatus } from "./chatUtils.ts";
import { add } from "./dateUtils.ts";
import { generateAIResponse } from "./openaiUtils.ts";
import { checkForTaskCommands, extractTaskDetails } from "./taskUtils.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request data
    const { message, userId } = await req.json();

    // Validate the message
    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid message parameter" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Validate the userId
    if (!userId || typeof userId !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid userId parameter" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Initialize the Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Store the user message
    await storeUserMessage(supabase, message, userId);

    // Check for timer intent in the message
    const timerIntent = parseTimerIntent(message);
    if (timerIntent) {
      console.log("Detected timer intent:", timerIntent);
      const timerData = await handleTimerIntent(supabase, timerIntent, userId);
      
      // Generate a user-friendly response
      let timerResponse = "I'll set a timer for you.";
      if (timerData) {
        switch (timerData.action) {
          case 'created':
            const labelText = timerData.label ? ` for "${timerData.label}"` : '';
            timerResponse = `I've set a timer${labelText} for ${timerData.duration_minutes} ${timerData.duration_minutes === 1 ? 'minute' : 'minutes'}. I'll notify you when it's done!`;
            break;
          case 'cancelled':
            timerResponse = timerData.message || "I've cancelled your timer.";
            break;
          case 'checked':
            timerResponse = timerData.message || "You don't have any active timers.";
            break;
          default:
            timerResponse = "I've processed your timer request.";
        }
      }
      
      // Store the AI response
      await storeAIMessage(supabase, timerResponse, userId);
      
      // Return the response with timer data
      return new Response(
        JSON.stringify({ 
          response: timerResponse,
          timer: timerData // Include timer data in the response
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Check for task commands
    const taskCommandResult = await checkForTaskCommands(message, userId, supabase);
    if (taskCommandResult.isTaskCommand) {
      // Store the AI response
      await storeAIMessage(supabase, taskCommandResult.response, userId);
      
      return new Response(
        JSON.stringify({ response: taskCommandResult.response }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get the chat history
    const chatHistory = await getChatHistory(supabase, userId);

    // Generate the AI response
    const aiResponse = await generateAIResponse(message, chatHistory, openaiApiKey);

    // Store the AI response
    await storeAIMessage(supabase, aiResponse, userId);

    // Extract task details if present
    const taskDetails = extractTaskDetails(aiResponse);

    // Return the response
    return new Response(
      JSON.stringify({ response: aiResponse, task: taskDetails }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing chat:", error);
    return new Response(
      JSON.stringify({ error: "Error processing request", details: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// Store a user message
async function storeUserMessage(supabase: any, content: string, userId: string) {
  try {
    const { error } = await supabase.from("chat_messages").insert({
      content,
      user_id: userId,
      is_ai: false,
    });

    if (error) {
      console.error("Error storing user message:", error);
    }
  } catch (error) {
    console.error("Error storing user message:", error);
  }
}

// Store an AI message
async function storeAIMessage(supabase: any, content: string, userId: string) {
  try {
    const { error } = await supabase.from("chat_messages").insert({
      content,
      user_id: userId,
      is_ai: true,
    });

    if (error) {
      console.error("Error storing AI message:", error);
    }
  } catch (error) {
    console.error("Error storing AI message:", error);
  }
}

// Get the chat history
async function getChatHistory(supabase: any, userId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("content, is_ai, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(20);

    if (error) {
      console.error("Error getting chat history:", error);
      return [];
    }

    return data.map((message: any) => ({
      content: message.content,
      role: message.is_ai ? "assistant" : "user",
    }));
  } catch (error) {
    console.error("Error getting chat history:", error);
    return [];
  }
}

// Handle a timer intent
async function handleTimerIntent(
  supabase: any,
  timerIntent: TimerIntent,
  userId: string
): Promise<any> {
  try {
    // Process based on the action type
    switch (timerIntent.action) {
      case "create":
        console.log(`Creating timer for ${timerIntent.minutes} minutes`);
        
        // Calculate expiration time
        const expiresAt = add(new Date(), { minutes: timerIntent.minutes });
        
        // Insert the timer
        const { data, error } = await supabase
          .from("timer_sessions")
          .insert({
            user_id: userId,
            label: timerIntent.label,
            duration_minutes: timerIntent.minutes,
            expires_at: expiresAt.toISOString(),
            is_active: true,
            is_completed: false,
          })
          .select()
          .single();
        
        if (error) {
          console.error("Error creating timer:", error);
          return null;
        }
        
        console.log("Timer created:", data);
        return {
          action: 'created',
          id: data.id,
          label: timerIntent.label,
          duration_minutes: timerIntent.minutes,
          expires_at: expiresAt.toISOString(),
          message: `Timer set for ${timerIntent.minutes} ${timerIntent.minutes === 1 ? 'minute' : 'minutes'}${timerIntent.label ? ` (${timerIntent.label})` : ''}`
        };
        
      case "cancel":
        const cancelResult = await cancelTimer(supabase, userId);
        return {
          action: 'cancelled',
          success: cancelResult.success,
          message: cancelResult.message
        };
        
      case "check":
        const checkResult = await checkTimerStatus(supabase, userId);
        return {
          action: 'checked',
          success: checkResult.success,
          message: checkResult.message,
          data: checkResult.data
        };
        
      default:
        console.error("Unknown timer action:", timerIntent.action);
        return null;
    }
  } catch (error) {
    console.error("Error handling timer intent:", error);
    return null;
  }
}
