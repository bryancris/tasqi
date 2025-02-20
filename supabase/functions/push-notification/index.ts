
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationData {
  title: string;
  body?: string;
  icon?: string;
  data?: Record<string, unknown>;
  userId: string;
  notificationEventId?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestData = await req.json()
    const { title, body, icon, data, userId, notificationEventId } = requestData as NotificationData

    console.log(`[Push Notification] Processing notification for user ${userId}:`, { title, body })

    // Fetch all active device tokens for the user
    const { data: deviceTokens, error: tokenError } = await supabaseClient
      .from('push_device_tokens')
      .select('*')
      .eq('user_id', userId)

    if (tokenError) {
      throw new Error(`Error fetching device tokens: ${tokenError.message}`)
    }

    if (!deviceTokens?.length) {
      console.log(`[Push Notification] No device tokens found for user ${userId}`)
      return new Response(
        JSON.stringify({ message: 'No device tokens found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = await Promise.all(deviceTokens.map(async (deviceToken) => {
      try {
        // Prepare platform-specific notification payload
        const notificationPayload = getPlatformSpecificPayload(
          deviceToken.platform,
          title,
          body,
          icon,
          data
        )

        // Send to Firebase Cloud Messaging
        const response = await fetch('https://fcm.googleapis.com/v1/projects/tasqi-6101c/messages:send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await getFirebaseAccessToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              token: deviceToken.token,
              ...notificationPayload
            }
          })
        })

        const fcmResult = await response.json()
        
        // Update notification event status
        if (notificationEventId) {
          await supabaseClient
            .from('notification_events')
            .update({
              delivery_status: response.ok ? 'delivered' : 'failed',
              delivery_platform: deviceToken.platform,
              device_token_id: deviceToken.id,
              delivery_attempts: deviceToken.delivery_attempts + 1,
              last_error: !response.ok ? fcmResult.error?.message : null
            })
            .eq('id', notificationEventId)
        }

        // Update device token last notification time
        await supabaseClient
          .from('push_device_tokens')
          .update({
            last_notification_time: new Date().toISOString(),
          })
          .eq('id', deviceToken.id)

        return {
          platform: deviceToken.platform,
          success: response.ok,
          error: response.ok ? null : fcmResult.error?.message
        }
      } catch (error) {
        console.error(`[Push Notification] Error sending to ${deviceToken.platform}:`, error)
        return {
          platform: deviceToken.platform,
          success: false,
          error: error.message
        }
      }
    }))

    const successCount = results.filter(r => r.success).length
    console.log(`[Push Notification] Delivery results:`, results)

    return new Response(
      JSON.stringify({ 
        message: `Notification sent to ${successCount}/${results.length} devices`,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Push Notification] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function getFirebaseAccessToken(): Promise<string> {
  const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_ADMIN_CONFIG') || '{}')
  
  const response = await fetch(
    `https://oauth2.googleapis.com/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: generateJWT(serviceAccount)
      })
    }
  )

  const data = await response.json()
  return data.access_token
}

function generateJWT(serviceAccount: any): string {
  const now = Math.floor(Date.now() / 1000)
  const hour = 3600
  const jwt = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + hour,
    iat: now
  }

  // Implementation of JWT signing omitted for brevity
  // In production, use a proper JWT library
  return signJWT(jwt, serviceAccount.private_key)
}

function getPlatformSpecificPayload(
  platform: string,
  title: string,
  body?: string,
  icon?: string,
  data?: Record<string, unknown>
) {
  const baseNotification = {
    title,
    body,
  }

  switch (platform) {
    case 'ios':
      return {
        notification: baseNotification,
        apns: {
          payload: {
            aps: {
              'mutable-content': 1,
              'content-available': 1,
              sound: 'default',
              badge: 1
            }
          }
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        }
      }

    case 'android':
      return {
        notification: baseNotification,
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#2ECC71',
            sound: 'default',
            channelId: 'task_notifications',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        }
      }

    case 'web':
    default:
      return {
        notification: {
          ...baseNotification,
          icon: icon || '/pwa-192x192.png',
        },
        webpush: {
          headers: {
            Urgency: 'high'
          },
          notification: {
            icon: icon || '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            actions: [
              {
                action: 'open',
                title: 'Open'
              }
            ]
          },
          fcm_options: {
            link: data?.url as string || '/'
          }
        },
        data
      }
  }
}

// Simplified JWT signing function - replace with proper JWT library in production
function signJWT(payload: any, privateKey: string): string {
  // This is a placeholder. In production, use a proper JWT library
  return 'signed.jwt.token'
}
