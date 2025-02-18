
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
    const url = `https://fcm.googleapis.com/v1/projects/${firebaseConfig.project_id}/messages:send`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getAccessToken()}`,
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
    })

    if (!response.ok) {
      throw new Error(`FCM request failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending FCM notification:', error)
    throw error
  }
}

async function getAccessToken(): Promise<string> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: createJWT(),
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to get access token')
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error getting access token:', error)
    throw error
  }
}

function createJWT(): string {
  const now = Math.floor(Date.now() / 1000)
  const oneHourFromNow = now + 3600

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }

  const claim = {
    iss: firebaseConfig.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: oneHourFromNow,
    iat: now,
  }

  // This is a simplified JWT creation - in production, use a proper JWT library
  const encodedHeader = btoa(JSON.stringify(header))
  const encodedClaim = btoa(JSON.stringify(claim))
  const signature = 'dummy_signature' // In production, properly sign this

  return `${encodedHeader}.${encodedClaim}.${signature}`
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: NotificationPayload = await req.json()
    console.log('Received notification payload:', payload)

    const fcmToken = await getFCMToken(payload.record.user_id)
    if (!fcmToken) {
      throw new Error('No FCM token found for user')
    }

    const result = await sendFCMNotification(fcmToken, payload.record)
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error processing notification:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
