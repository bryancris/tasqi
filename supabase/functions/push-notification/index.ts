
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

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
    const { token, title, body, data } = await req.json()

    if (!token) {
      throw new Error('FCM token is required')
    }

    console.log('📱 Sending push notification:', { title, body, data })

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${Deno.env.get('FIREBASE_SERVER_KEY')}`
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title,
          body,
          icon: '/lovable-uploads/98b0b439-cc30-41da-8912-7786e473fb9a.png',
          click_action: 'https://app.tasqi.com'
        },
        data: data || {}
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ FCM API Error:', errorText);
      throw new Error(`FCM API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Push notification sent successfully:', result);

    return new Response(
      JSON.stringify({ success: true, result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error sending push notification:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
})
