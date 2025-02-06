
// @deno-types="npm:@types/web-push@3.6.3"
import webPush from "npm:web-push@3.6.3"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Generate VAPID keys if GET request
    if (req.method === 'GET') {
      console.log('Generating VAPID keys...')
      const vapidKeys = webPush.generateVAPIDKeys()
      console.log('VAPID keys generated:', vapidKeys)
      return new Response(JSON.stringify(vapidKeys), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Handle push notification if POST request
    if (req.method === 'POST') {
      const { subscription, title, message } = await req.json()
      
      // Validate VAPID keys existence
      const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
      const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
      
      if (!vapidPublicKey || !vapidPrivateKey) {
        console.error('VAPID keys not configured')
        return new Response(
          JSON.stringify({ 
            error: 'Server configuration error: VAPID keys not found',
            details: 'VAPID keys need to be configured in the Supabase Edge Function secrets'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Validate subscription object
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        console.error('Invalid subscription object:', subscription)
        return new Response(
          JSON.stringify({ 
            error: 'Invalid subscription object',
            details: 'The push subscription object is missing required fields'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      console.log('Setting VAPID details...')
      webPush.setVapidDetails(
        'mailto:brymcafee@gmail.com',
        vapidPublicKey,
        vapidPrivateKey
      )

      console.log('Sending push notification...')
      console.log('Subscription:', subscription)
      console.log('Title:', title)
      console.log('Message:', message)

      await webPush.sendNotification(subscription, JSON.stringify({
        title,
        body: message,
      }))

      console.log('Push notification sent successfully')
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Push notification sent successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    })
  } catch (error) {
    console.error('Error in push-notification function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
