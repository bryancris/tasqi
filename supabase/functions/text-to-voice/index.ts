
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import OpenAI from 'https://esm.sh/openai@4.20.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, voice } = await req.json()

    if (!text) {
      throw new Error('Text is required')
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    // Use OpenAI client for chat completion
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a friendly personal assistant. Transform the following message into a more detailed, natural conversation.
          Important guidelines:
          1. List out each task individually with its specific time (if scheduled)
          2. Mention task priorities (if any are high priority)
          3. Add encouraging comments about task progress
          4. Use casual transitions like "By the way" or "Also"
          5. Add brief pauses with commas
          6. Keep it warm and personal, like talking to a friend
          7. If there are unscheduled tasks, suggest scheduling them
          8. Mention if any tasks seem particularly important or urgent`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.7,
    })

    const conversationalText = chatCompletion.choices[0].message.content

    // Use OpenAI client for speech generation
    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice || 'nova',
      input: conversationalText,
    })

    // Get the audio data as an ArrayBuffer
    const audioData = await mp3Response.arrayBuffer()
    
    // Convert ArrayBuffer to base64
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(audioData))
    )

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error in text-to-voice function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
