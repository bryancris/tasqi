
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    // Get JWT token from request header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    )

    // Verify the JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid token')
    }

    // Get VAPID key
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    if (!vapidPublicKey) {
      throw new Error('VAPID public key not configured')
    }

    // Return the VAPID public key
    return new Response(
      JSON.stringify({
        publicKey: vapidPublicKey,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in get-vapid-key function:', error)

    const status = error.message.includes('token') ? 401 : 500
    const message = status === 401 ? 'Unauthorized' : 'Internal Server Error'

    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
        status,
      }
    )
  }
})
