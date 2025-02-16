
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface WebhookPayload {
  token: string;
  email_address?: string;
  platform: 'android' | 'ios';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Get the webhook payload
    const payload: WebhookPayload = await req.json()
    const { token, email_address, platform } = payload

    // Validate required fields
    if (!token || !platform) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // If email is provided, look up the user
    let userId = null
    if (email_address) {
      const { data: userData, error: userError } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('email', email_address)
        .single()

      if (userError) {
        console.error('Error finding user:', userError)
      } else if (userData) {
        userId = userData.id
      }
    }

    // Store or update the device token
    if (userId) {
      const { error: upsertError } = await supabaseClient
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          device_token: token,
          platform,
          metadata: {
            registered_at: new Date().toISOString(),
            last_updated: new Date().toISOString()
          }
        }, {
          onConflict: 'user_id,platform,device_token'
        })

      if (upsertError) {
        console.error('Error upserting token:', upsertError)
        return new Response(
          JSON.stringify({ error: 'Failed to store token' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Token registered successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
