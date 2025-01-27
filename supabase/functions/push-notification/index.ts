import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as webPush from 'https://esm.sh/web-push@3.6.7'

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
    if (req.method === 'POST') {
      // Get the subscription object from the request
      const { subscription, title, message } = await req.json()

      // Configure web-push with your VAPID keys
      webPush.setVapidDetails(
        'mailto:brymcafee@gmail.com', // your email
        Deno.env.get('VAPID_PUBLIC_KEY') || '',
        Deno.env.get('VAPID_PRIVATE_KEY') || ''
      )

      // Send the notification
      await webPush.sendNotification(subscription, JSON.stringify({
        title,
        body: message,
      }))

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate VAPID keys if GET request
    if (req.method === 'GET') {
      const vapidKeys = webPush.generateVAPIDKeys()
      return new Response(JSON.stringify(vapidKeys), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})