
// process-notifications/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create a single supabase client for interacting with your database
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Fetching pending notifications...')
    
    // Process notification events (including timer notifications)
    const { data: events, error: eventsError } = await supabase
      .from('notification_events')
      .select('*')
      .eq('status', 'pending')
      .limit(100)
    
    if (eventsError) {
      throw eventsError
    }

    console.log(`📬 Found ${events.length} pending notification events to process`)
    
    for (const event of events) {
      try {
        console.log(`🔔 Processing event ID: ${event.id}, type: ${event.event_type}`)
        
        // Handle timer completion events
        if (event.event_type === 'timer_complete') {
          await processTimerNotification(event)
        } 
        // Handle task reminder events
        else if (event.event_type === 'task_reminder') {
          await processTaskReminder(event)
        }
        
        // Mark event as processed
        await supabase
          .from('notification_events')
          .update({ status: 'processed', processed_at: new Date().toISOString() })
          .eq('id', event.id)
          
      } catch (eventError) {
        console.error(`❌ Error processing event ${event.id}:`, eventError)
        
        // Mark as failed but don't throw so we can continue with other events
        await supabase
          .from('notification_events')
          .update({ 
            status: 'failed', 
            processed_at: new Date().toISOString(),
            error_message: String(eventError)
          })
          .eq('id', event.id)
      }
    }
    
    // Also check for newly completed timers directly
    await checkForCompletedTimers()
    
    return new Response(
      JSON.stringify({ success: true, processed: events.length }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('❌ Error in process-notifications function:', error)
    return new Response(
      JSON.stringify({ error: String(error) }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function processTimerNotification(event: any) {
  console.log('⏰ Processing timer notification:', event.metadata)
  
  // 1. Get token for user
  const { data: tokens, error: tokenError } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', event.user_id)
  
  if (tokenError) {
    console.error('❌ Error fetching tokens:', tokenError)
    return
  }
  
  // 2. Send web push for each token
  for (const token of tokens || []) {
    try {
      await sendWebPushNotification(token.subscription, {
        title: event.metadata.title || 'Timer Complete',
        body: event.metadata.message || 'Your timer has completed',
        tag: `timer-${event.metadata.timer_id || 'unknown'}`,
        data: {
          url: '/dashboard',
          timerId: event.metadata.timer_id
        }
      })
    } catch (pushError) {
      console.error('❌ Error sending push notification:', pushError)
    }
  }
  
  // Also create in-app notification if it doesn't exist
  try {
    const { count, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('reference_id', String(event.metadata.timer_id))
      .eq('type', 'timer_complete')
    
    if (countError) throw countError
    
    // Only create if not exists
    if (count === 0) {
      await supabase.from('notifications').insert({
        user_id: event.user_id,
        title: event.metadata.title || 'Timer Complete',
        message: event.metadata.message || 'Your timer has completed',
        type: 'timer_complete',
        reference_id: String(event.metadata.timer_id),
        reference_type: 'timer'
      })
    }
  } catch (notifError) {
    console.error('❌ Error creating in-app notification:', notifError)
  }
}

async function processTaskReminder(event: any) {
  console.log('🔔 Processing task reminder:', event.metadata)
  
  // Implementation for task reminders (similar to timer logic)
  const { data: tokens, error: tokenError } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', event.user_id)
  
  if (tokenError) {
    console.error('❌ Error fetching tokens:', tokenError)
    return
  }
  
  for (const token of tokens || []) {
    try {
      await sendWebPushNotification(token.subscription, {
        title: 'Task Reminder',
        body: event.metadata.title || 'You have a task due soon',
        tag: `task-${event.task_id || 'unknown'}`,
        data: {
          url: '/dashboard',
          taskId: event.task_id
        }
      })
    } catch (pushError) {
      console.error('❌ Error sending push notification:', pushError)
    }
  }
}

// Additional check for newly completed timers (directly from DB)
async function checkForCompletedTimers() {
  try {
    // Call the database function to process timers
    await supabase.rpc('process_completed_timers')
    console.log('✅ Checked for completed timers')
  } catch (error) {
    console.error('❌ Error checking for completed timers:', error)
  }
}

// Function to send web push notifications
async function sendWebPushNotification(subscription: any, notification: any) {
  try {
    // This is a placeholder - in a real implementation, you would use the Web Push API
    // For now, we're just logging what would be sent
    console.log('🔔 Would send web push notification:', { subscription, notification })
    
    // TODO: Implement actual web push using the subscription
    // You would use the web-push library or equivalent in a real implementation
    
    return true
  } catch (error) {
    console.error('❌ Error in sendWebPushNotification:', error)
    return false
  }
}
