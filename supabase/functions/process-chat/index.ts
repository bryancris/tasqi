
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
    console.log("Handling CORS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204 // No Content is the proper response for OPTIONS
    });
  }

  try {
    console.log("Processing chat request");
    
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
    try {
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
    } catch (timerError) {
      console.error("Error processing timer intent:", timerError);
      // Continue with normal processing if timer intent fails
    }

    // Check for task commands - ENHANCED to be more aggressive with task detection
    try {
      // Use more aggressive task detection - if it contains any action verbs or places, consider it a task
      const containsTaskLanguage = /\b(go|get|pick|buy|call|email|visit|remember|need|want|should|must|have to|check|do|make|send|write|read|clean|wash|cook|prepare|attend|meet|schedule|organize|pay|finish|complete|work on|take|bring|drop|deliver|order|cancel|update|review|watch|listen)\b/i.test(message);
      const containsPlaces = /\b(store|walmart|target|grocery|market|shop|mall|office|home|school|library|bank|restaurant|cafe|gym|park|doctor|dentist|hospital|pharmacy|gas station)\b/i.test(message);
      
      const mightBeTask = containsTaskLanguage || containsPlaces || 
                         message.toLowerCase().includes("to") || 
                         message.toLowerCase().includes("task") ||
                         message.length < 60; // Short messages are often tasks
      
      if (mightBeTask) {
        console.log("Detected potential task in message:", message);
        
        // Directly try to create a task rather than checking if it's a command
        const { data: taskData, error: taskError } = await supabase.functions.invoke('process-task', {
          body: { message, userId }
        });
        
        if (taskError) {
          console.error("Error invoking process-task:", taskError);
        } else if (taskData?.success && taskData?.task) {
          console.log("Successfully created task from chat message:", taskData.task);
          
          // Store the AI response
          await storeAIMessage(supabase, taskData.response, userId);
          
          // Return the response with task data
          return new Response(
            JSON.stringify({ 
              response: taskData.response,
              taskCreated: true,
              task: taskData.task
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            }
          );
        }
      }
    } catch (taskError) {
      console.error("Error processing potential task:", taskError);
      // Continue with normal processing if task intent fails
    }

    // Get the chat history
    const chatHistory = await getChatHistory(supabase, userId);

    // Generate the AI response
    console.log("Generating AI response for:", message.substring(0, 30) + "...");
    const aiResponse = await generateAIResponse(message, chatHistory, openaiApiKey);
    console.log("AI response generated:", aiResponse.substring(0, 30) + "...");

    // Store the AI response
    await storeAIMessage(supabase, aiResponse, userId);

    // Extract task details if present or if the response indicates a task was created
    const taskDetails = extractTaskDetails(aiResponse);
    const responseIndicatesTask = aiResponse.toLowerCase().includes("created a task") ||
                                 aiResponse.toLowerCase().includes("added a task") ||
                                 aiResponse.toLowerCase().includes("scheduled a task") ||
                                 aiResponse.toLowerCase().includes("i've added") || 
                                 aiResponse.toLowerCase().includes("added to your tasks") ||
                                 aiResponse.toLowerCase().includes("i've created") ||
                                 aiResponse.toLowerCase().includes("created the task") ||
                                 aiResponse.toLowerCase().includes("made a task");

    // If the response indicates a task but we don't have task details, try to create one
    if (responseIndicatesTask && !taskDetails) {
      try {
        console.log("Response indicates task creation but no task details, creating task from message:", message);
        const { data: fallbackTaskData, error: fallbackTaskError } = await supabase.functions.invoke('process-task', {
          body: { message, userId }
        });
        
        if (fallbackTaskError) {
          console.error("Error in fallback task creation:", fallbackTaskError);
        } else if (fallbackTaskData?.success && fallbackTaskData?.task) {
          console.log("Successfully created fallback task:", fallbackTaskData.task);
          
          return new Response(
            JSON.stringify({ 
              response: aiResponse,
              taskCreated: true,
              task: fallbackTaskData.task
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            }
          );
        }
      } catch (fallbackError) {
        console.error("Error in fallback task creation:", fallbackError);
      }
    }

    console.log("Task created:", !!(taskDetails || responseIndicatesTask), "Task details:", taskDetails);

    // Return the response
    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        task: taskDetails,
        taskCreated: !!(taskDetails || responseIndicatesTask) // More aggressively mark as task created
      }),
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
          // Return a simplified response to avoid client-side processing errors
          return {
            action: 'created',
            success: false,
            message: "Created a timer but couldn't save it. I'll remind you anyway!",
            duration_minutes: timerIntent.minutes
          };
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
        return {
          action: 'error',
          success: false,
          message: "I couldn't understand that timer request. Try something like 'set a 5 minute timer'."
        };
    }
  } catch (error) {
    console.error("Error handling timer intent:", error);
    // Return a simplified response that won't cause client-side processing errors
    return {
      action: 'error',
      success: false,
      message: "I had trouble with that timer. Let's try again.",
      error: error.message
    };
  }
}
