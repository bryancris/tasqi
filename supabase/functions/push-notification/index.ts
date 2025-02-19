
import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const firebaseConfig = JSON.parse(Deno.env.get('FIREBASE_ADMIN_CONFIG')!)

interface NotificationPayload {
  type: 'INSERT'
  table: string
  record: {
    id: string
    user_id: string
    title: string
    message: string
    body: string
  }
  schema: 'public'
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function getFCMToken(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data?.fcm_token || null
  } catch (error) {
    console.error('Error fetching FCM token:', error)
    return null
  }
}

async function sendFCMNotification(fcmToken: string, notification: any) {
  try {
    const accessToken = await getAccessToken();
    const url = `https://fcm.googleapis.com/v1/projects/${firebaseConfig.project_id}/messages:send`;
    
    console.log('Sending FCM notification with token:', fcmToken);
    
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
            title: notification.title,
            body: notification.body || notification.message,
          },
          data: {
            type: 'task_notification',
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FCM request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('FCM notification sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending FCM notification:', error);
    throw error;
  }
}

async function getAccessToken(): Promise<string> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const oneHourFromNow = now + 3600;

    const jwtHeader = {
      alg: 'RS256',
      typ: 'JWT',
      kid: firebaseConfig.private_key_id
    };

    const jwtClaim = {
      iss: firebaseConfig.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: oneHourFromNow,
      iat: now,
    };

    // Create the JWT using the Web Crypto API
    const encoder = new TextEncoder();
    const headerData = encoder.encode(JSON.stringify(jwtHeader));
    const claimData = encoder.encode(JSON.stringify(jwtClaim));
    
    const privateKey = firebaseConfig.private_key.replace(/\\n/g, '\n');
    const keyData = await crypto.subtle.importKey(
      'pkcs8',
      str2ab(atob(privateKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, ''))),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      { name: 'RSASSA-PKCS1-v1_5' },
      keyData,
      new Uint8Array([...headerData, ...claimData])
    );

    const jwt = `${btoa(JSON.stringify(jwtHeader))}.${btoa(JSON.stringify(jwtClaim))}.${btoa(String.fromCharCode.apply(null, new Uint8Array(signature)))}`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get access token');
    }

    const data = await tokenResponse.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

// Helper function to convert string to ArrayBuffer
function str2ab(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();
    console.log('Received notification payload:', payload);

    const fcmToken = await getFCMToken(payload.record.user_id);
    if (!fcmToken) {
      throw new Error('No FCM token found for user');
    }

    const result = await sendFCMNotification(fcmToken, payload.record);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing notification:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
