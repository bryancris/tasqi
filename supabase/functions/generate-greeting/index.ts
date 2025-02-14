
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { tasks, userId } = await req.json();

    // Format tasks data for the AI
    const scheduledTasks = tasks.filter((t: any) => t.status === 'scheduled');
    const unscheduledTasks = tasks.filter((t: any) => t.status === 'unscheduled');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a highly efficient and attentive personal assistant. Your role is to:
            1. Greet the user warmly based on the time of day
            2. Briefly summarize their schedule
            3. Ask if they'd like to make any adjustments or need help prioritizing tasks
            4. Be proactive about potential scheduling conflicts or time management issues
            
            Keep your tone professional but warm and conversational, like a capable assistant speaking to their boss.
            Focus on being helpful and proactive, but concise.
            Don't be overly formal - use natural, conversational language.`
          },
          {
            role: 'user',
            content: `Generate an interactive greeting with this task information:
            Scheduled Tasks: ${JSON.stringify(scheduledTasks)}
            Unscheduled Tasks: ${JSON.stringify(unscheduledTasks)}
            
            Consider things like:
            - Are there any tight deadlines?
            - Are there too many unscheduled tasks?
            - Would any tasks benefit from being prioritized?
            - Are there any potential scheduling conflicts?`
          }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const generatedMessage = data.choices[0].message.content;

    // Update the user's settings with the new greeting
    await supabase
      .from('user_settings')
      .update({ 
        greeting_message: generatedMessage,
        last_greeting_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    return new Response(
      JSON.stringify({ message: generatedMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
