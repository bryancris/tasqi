
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationEvent {
  id: number
  event_type: string
  user_id: string
  task_id: number
  metadata: {
    title: string
    message?: string
    date?: string
    start_time?: string
    end_time?: string
    reminder_time?: string
  }
  status: string
  delivery_platform?: string
  delivery_status?: string
  last_error?: string
}

interface DeviceToken {
  id: number
  token: string
  platform: string
  notification_settings: {
    enabled: boolean
    task_reminders: boolean
    task_updates: boolean
  }
}

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables')
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔄 Fetching pending notifications...')

    // Get pending notifications
    const { data: notifications, error: notificationsError } = await supabase
      .from('notification_events')
      .select('*')
      .eq('status', 'pending')
      .is('delivery_status', null)
      .order('created_at', { ascending: true })

    if (notificationsError) {
      throw notificationsError
    }

    console.log(`Found ${notifications?.length || 0} pending notifications`)

    // Process each notification
    for (const notification of notifications || []) {
      try {
        // Get user's device tokens
        const { data: deviceTokens, error: deviceTokensError } = await supabase
          .from('push_device_tokens')
          .select('*')
          .eq('user_id', notification.user_id)
          .eq('platform', 'web')

        if (deviceTokensError) {
          throw deviceTokensError
        }

        // Skip if no device tokens found
        if (!deviceTokens?.length) {
          await updateNotificationStatus(supabase, notification.id, 'skipped', 'No device tokens found')
          continue
        }

        // Send notification to each device
        for (const device of deviceTokens) {
          try {
            // Check if notifications are enabled for this device
            if (!device.notification_settings?.enabled) {
              console.log('Notifications disabled for device:', device.id)
              continue
            }

            // Send web notification
            await sendWebNotification(notification, device)

            // Update notification status
            await updateNotificationStatus(supabase, notification.id, 'delivered')
          } catch (error) {
            console.error('Error sending notification to device:', error)
            await updateNotificationStatus(
              supabase,
              notification.id,
              'failed',
              error instanceof Error ? error.message : 'Unknown error'
            )
          }
        }
      } catch (error) {
        console.error('Error processing notification:', error)
        await updateNotificationStatus(
          supabase,
          notification.id,
          'failed',
          error instanceof Error ? error.message : 'Unknown error'
        )
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in process-notifications:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

async function updateNotificationStatus(
  supabase: any,
  notificationId: number,
  status: string,
  error?: string
) {
  const { error: updateError } = await supabase
    .from('notification_events')
    .update({
      delivery_status: status,
      last_error: error,
      processed_at: new Date().toISOString(),
    })
    .eq('id', notificationId)

  if (updateError) {
    console.error('Error updating notification status:', updateError)
  }
}

async function sendWebNotification(notification: NotificationEvent, device: DeviceToken) {
  // Here we'd typically use a web push service
  // For now, we'll just log the notification
  console.log('Would send notification:', {
    title: notification.metadata.title,
    message: notification.metadata.message,
    deviceToken: device.token,
  })
}
