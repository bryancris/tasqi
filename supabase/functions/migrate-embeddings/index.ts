
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { generateEmbeddingQuery } from "../_shared/embeddings-utils.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    console.log("Starting embedding migration");
    
    // Initialize the Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Execute the SQL commands to add vector extension and similarity function
    const { error: sqlError } = await supabase.rpc('exec_sql', { 
      sql_query: generateEmbeddingQuery 
    }).single();
    
    if (sqlError) {
      console.error("Error executing SQL setup:", sqlError);
      
      // Try direct SQL instead of RPC (as fallback)
      const { error: directSqlError } = await supabase.sql(generateEmbeddingQuery);
      
      if (directSqlError) {
        console.error("Error with direct SQL execution:", directSqlError);
        throw new Error("Could not set up vector extension and functions");
      }
    }
    
    // Fetch messages that don't have embeddings yet
    const { data: messagesToEmbed, error: fetchError } = await supabase
      .from('chat_messages')
      .select('id, content, user_id')
      .is('embedding', null)
      .eq('is_ai', false)  // Only generate embeddings for user messages
      .order('created_at', { ascending: false })
      .limit(100);  // Process in batches
    
    if (fetchError) {
      console.error("Error fetching messages to embed:", fetchError);
      throw fetchError;
    }
    
    console.log(`Found ${messagesToEmbed?.length || 0} messages to generate embeddings for`);
    
    // Process each message and generate embeddings
    const results = [];
    if (messagesToEmbed && messagesToEmbed.length > 0) {
      for (const message of messagesToEmbed) {
        try {
          // Skip empty messages
          if (!message.content || message.content.trim() === "") continue;
          
          // Generate embedding via OpenAI API
          const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openaiApiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "text-embedding-3-small",
              input: message.content
            })
          });
          
          if (!embeddingResponse.ok) {
            throw new Error(`OpenAI API returned ${embeddingResponse.status}: ${await embeddingResponse.text()}`);
          }
          
          const embeddingData = await embeddingResponse.json();
          const embedding = embeddingData.data[0].embedding;
          
          // Update message with embedding
          const { error: updateError } = await supabase
            .from('chat_messages')
            .update({ embedding })
            .eq('id', message.id);
          
          if (updateError) {
            console.error(`Error updating message ${message.id}:`, updateError);
            results.push({ id: message.id, success: false, error: updateError.message });
          } else {
            results.push({ id: message.id, success: true });
          }
          
          // Delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.error(`Error processing message ${message.id}:`, error);
          results.push({ id: message.id, success: false, error: error.message });
        }
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        details: results
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in migrate-embeddings function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message, 
        details: error.stack 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
