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
      
      if (!Deno.env.get('VAPID_PUBLIC_KEY') || !Deno.env.get('VAPID_PRIVATE_KEY')) {
        throw new Error('VAPID keys not configured')
      }

      webPush.setVapidDetails(
        'mailto:brymcafee@gmail.com',
        Deno.env.get('VAPID_PUBLIC_KEY') || '',
        Deno.env.get('VAPID_PRIVATE_KEY') || ''
      )

      await webPush.sendNotification(subscription, JSON.stringify({
        title,
        body: message,
      }))

      return new Response(JSON.stringify({ success: true }), {
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