
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';

// Initialize Supabase client with service role key
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const firebaseConfig = JSON.parse(Deno.env.get('FIREBASE_ADMIN_CONFIG')!);

async function getFCMToken(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data?.fcm_token || null;
  } catch (error) {
    console.error('Error fetching FCM token:', error);
    return null;
  }
}

async function getAccessToken(): Promise<string> {
  try {
    const { privateKey, clientEmail } = firebaseConfig;
    const now = Math.floor(Date.now() / 1000);
    const oneHourFromNow = now + 3600;

    // Create JWT header
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: privateKey.replace(/\\n/g, '\n'),
    };

    // Create JWT claim
    const claim = {
      iss: clientEmail,
      sub: clientEmail,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: oneHourFromNow,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
    };

    // Sign JWT
    const encoder = new TextEncoder();
    const keyData = encoder.encode(privateKey.replace(/\\n/g, '\n'));
    const key = await crypto.subtle.importKey(
      'pkcs8',
      keyData,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const headerEncoded = btoa(JSON.stringify(header));
    const claimEncoded = btoa(JSON.stringify(claim));
    const signatureInput = `${headerEncoded}.${claimEncoded}`;
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      encoder.encode(signatureInput)
    );

    const jwt = `${headerEncoded}.${claimEncoded}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get access token');
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

async function sendFCMNotification(fcmToken: string, notification: any) {
  try {
    const accessToken = await getAccessToken();
    const url = `https://fcm.googleapis.com/v1/projects/${firebaseConfig.projectId}/messages:send`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token: fcmToken,
          notification: {
            title: notification.metadata.title || 'Task Reminder',
            body: `Task due ${notification.metadata.start_time ? `at ${notification.metadata.start_time}` : 'today'}`,
          },
          data: {
            type: 'task_reminder',
            taskId: notification.task_id.toString(),
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
          },
          webpush: {
            headers: {
              Urgency: 'high',
            },
            notification: {
              requireInteraction: true,
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              vibrate: [200, 100, 200],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`FCM request failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending FCM notification:', error);
    throw error;
  }
}

async function processNotifications() {
  try {
    // Get current time in UTC
    const now = new Date();
    
    // Get pending notification events that are due
    const { data: notifications, error } = await supabase
      .from('notification_events')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;

    console.log(`Found ${notifications?.length || 0} pending notifications`);

    // Process each notification
    for (const notification of notifications || []) {
      try {
        const fcmToken = await getFCMToken(notification.user_id);
        
        if (!fcmToken) {
          console.error(`No FCM token found for user ${notification.user_id}`);
          continue;
        }

        // Send the notification
        await sendFCMNotification(fcmToken, notification);

        // Update notification status to processed
        const { error: updateError } = await supabase
          .from('notification_events')
          .update({ 
            status: 'processed',
            processed_at: new Date().toISOString()
          })
          .eq('id', notification.id);

        if (updateError) throw updateError;

        console.log(`Successfully processed notification ${notification.id}`);
      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);
        
        // Update notification status to failed
        await supabase
          .from('notification_events')
          .update({ 
            status: 'failed',
            error: error.message
          })
          .eq('id', notification.id);
      }
    }

    return { success: true, processed: notifications?.length || 0 };
  } catch (error) {
    console.error('Error in processNotifications:', error);
    throw error;
  }
}

// Handle incoming requests
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const result = await processNotifications();
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing notifications:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
