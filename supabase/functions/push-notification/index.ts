
import webpush from "npm:web-push"
import { createClient } from "npm:@supabase/supabase-js"
import { Application, Router } from "npm:@supabase/functions-js"
import { initializeApp, cert } from "npm:firebase-admin/app"
import { getMessaging } from "npm:firebase-admin/messaging"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
const supabase = createClient(supabaseUrl, supabaseKey)

// Initialize Firebase Admin
const firebaseConfig = JSON.parse(Deno.env.get('FIREBASE_ADMIN_CONFIG') || '{}')
const firebaseApp = initializeApp({
  credential: cert(firebaseConfig)
})

// Configure Web Push
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:support@tasqi.app',
    vapidPublicKey,
    vapidPrivateKey
  )
}

async function processNotificationEvent(event: any) {
  try {
    console.log('Processing notification event:', event)
    
    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', event.user_id)

    if (subError) {
      throw new Error(`Failed to fetch push subscriptions: ${subError.message}`)
    }

    if (!subscriptions?.length) {
      console.log('No push subscriptions found for user:', event.user_id)
      return
    }

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', event.task_id)
      .single()

    if (taskError) {
      throw new Error(`Failed to fetch task: ${taskError.message}`)
    }

    // Prepare notification content based on event type
    let title: string
    let body: string

    switch (event.event_type) {
      case 'task_reminder':
        title = `Reminder: ${task.title}`
        body = task.start_time 
          ? `Task due at ${task.start_time}`
          : 'Task due today'
        break
      case 'task_shared':
        title = 'New Shared Task'
        body = `A task has been shared with you: ${task.title}`
        break
      case 'task_status_changed':
        const { old_status, new_status } = event.metadata
        title = 'Task Status Updated'
        body = `${task.title} changed from ${old_status} to ${new_status}`
        break
      default:
        title = 'Task Update'
        body = `Update for task: ${task.title}`
    }

    // Send notifications to all subscriptions
    const notificationPromises = subscriptions.map(async (sub: any) => {
      try {
        if (sub.platform === 'web') {
          // Send Web Push notification
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: sub.auth_keys
          }
          
          await webpush.sendNotification(pushSubscription, JSON.stringify({
            title,
            body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            data: {
              url: `${supabaseUrl}/dashboard`,
              taskId: task.id
            }
          }))
          console.log('Web Push notification sent successfully')
        } else {
          // Send Firebase Cloud Message
          const message = {
            token: sub.device_token,
            notification: {
              title,
              body,
            },
            data: {
              taskId: task.id.toString(),
              type: event.event_type
            },
            android: {
              notification: {
                icon: 'ic_notification',
                color: '#4A90E2'
              }
            },
            apns: {
              payload: {
                aps: {
                  'mutable-content': 1,
                  'content-available': 1
                }
              }
            }
          }
          
          await getMessaging().send(message)
          console.log('Firebase notification sent successfully')
        }
      } catch (error) {
        console.error('Error sending notification:', error)
        // Don't throw here, we want to try other subscriptions
      }
    })

    await Promise.all(notificationPromises)

    // Update the notification event as processed
    const { error: updateError } = await supabase
      .from('notification_events')
      .update({ 
        processed_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', event.id)

    if (updateError) {
      throw new Error(`Failed to update notification event: ${updateError.message}`)
    }

  } catch (error) {
    console.error('Error processing notification:', error)
    
    // Update error count and status
    await supabase
      .from('notification_events')
      .update({ 
        error_count: (event.error_count || 0) + 1,
        last_error: error.message,
        status: 'failed'
      })
      .eq('id', event.id)
    
    throw error
  }
}

// Process all pending notifications
async function processPendingNotifications(req: Request) {
  try {
    const { data: events, error } = await supabase
      .from('notification_events')
      .select('*')
      .is('processed_at', null)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10)

    if (error) {
      throw new Error(`Failed to fetch notification events: ${error.message}`)
    }

    console.log(`Processing ${events?.length || 0} pending notifications`)

    if (events && events.length > 0) {
      for (const event of events) {
        await processNotificationEvent(event)
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      processed: events?.length || 0 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error processing notifications:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}

// Handle CORS preflight requests
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    })
  }

  return processPendingNotifications(req)
})
