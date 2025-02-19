
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AndroidConfig {
  notification: {
    title: string;
    body: string;
    click_action?: string;
    icon?: string;
  };
  data?: Record<string, string>;
}

interface WebConfig {
  notification: {
    title: string;
    body: string;
    icon?: string;
    click_action?: string;
  };
  webpush: {
    fcm_options: {
      link?: string;
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { token, title, body, data, platform = 'web' } = await req.json()

    if (!token) {
      throw new Error('FCM token is required')
    }

    console.log(`📱 Sending ${platform} push notification:`, { title, body, data })

    let message: AndroidConfig | WebConfig;

    if (platform === 'android') {
      message = {
        notification: {
          title,
          body,
          icon: '/lovable-uploads/98b0b439-cc30-41da-8912-7786e473fb9a.png',
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        }
      };
    } else {
      // Web configuration
      message = {
        notification: {
          title,
          body,
          icon: '/lovable-uploads/98b0b439-cc30-41da-8912-7786e473fb9a.png',
          click_action: 'https://app.tasqi.com'
        },
        webpush: {
          fcm_options: {
            link: 'https://app.tasqi.com'
          }
        }
      };
    }

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${Deno.env.get('FIREBASE_SERVER_KEY')}`
      },
      body: JSON.stringify({
        to: token,
        ...message
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

