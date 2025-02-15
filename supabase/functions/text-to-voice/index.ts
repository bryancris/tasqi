
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

    console.log('Processing text:', text)

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    // Use OpenAI client for speech generation directly
    // Skip the chat completion step for now to debug the core functionality
    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice || 'nova',
      input: text,
    })

    // Safely handle the binary data
    const audioBytes = await mp3Response.arrayBuffer()
    const audioArray = new Uint8Array(audioBytes)
    
    // Convert to base64 in chunks to prevent stack overflow
    const chunkSize = 32768
    const chunks: string[] = []
    
    for (let i = 0; i < audioArray.length; i += chunkSize) {
      const chunk = audioArray.slice(i, i + chunkSize)
      chunks.push(String.fromCharCode.apply(null, chunk))
    }
    
    const base64Audio = btoa(chunks.join(''))

    console.log('Successfully generated audio')

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
