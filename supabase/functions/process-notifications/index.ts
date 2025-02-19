
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Processing notifications...')

    // Get all pending notification events
    const { data: events, error: eventsError } = await supabase
      .from('notification_events')
      .select('*')
      .eq('status', 'pending')
    
    if (eventsError) {
      throw eventsError
    }

    console.log(`Found ${events?.length || 0} pending notifications`)

    const now = new Date()
    const processedEvents = []

    for (const event of events) {
      try {
        if (event.event_type === 'task_reminder') {
          const metadata = event.metadata
          
          console.log('Event metadata:', JSON.stringify(metadata, null, 2))
          
          // Parse task date and time precisely
          const [hours, minutes] = metadata.start_time.split(':').map(Number)
          const taskDate = new Date(metadata.date)
          taskDate.setHours(hours, minutes, 0, 0)
          
          // Convert reminder_time to number
          const reminderTime = Number(metadata.reminder_time)
          
          if (isNaN(reminderTime) || reminderTime <= 0) {
            console.log('Invalid reminder time for task:', metadata.title, 'Reminder time:', metadata.reminder_time)
            processedEvents.push(event.id)
            continue
          }

          // Calculate exact notification time (X minutes before task time)
          const notificationTime = new Date(taskDate.getTime() - (reminderTime * 60 * 1000))
          
          // Debug logs
          console.log('Task:', metadata.title)
          console.log('Task date:', metadata.date)
          console.log('Task start_time:', metadata.start_time)
          console.log('Task time:', taskDate.toISOString())
          console.log('Reminder minutes:', reminderTime)
          console.log('Notification time:', notificationTime.toISOString())
          console.log('Current time:', now.toISOString())
          
          // Calculate time remaining until notification
          const timeUntilNotification = notificationTime.getTime() - now.getTime()
          console.log('Time until notification (ms):', timeUntilNotification)
          
          // Only send notification if it's exactly time (within a 5-second window)
          // This ensures we don't send notifications too early
          const isNotificationTime = Math.abs(timeUntilNotification) <= 5000; // 5-second window
          
          if (isNotificationTime) {
            console.log('⏰ Sending notification - within 5-second window of exact notification time')
            const { data: profile } = await supabase
              .from('profiles')
              .select('fcm_token')
              .eq('id', event.user_id)
              .single()

            if (profile?.fcm_token) {
              const timeFormatter = new Intl.DateTimeFormat('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
              })

              const pushResponse = await fetch(
                `${Deno.env.get('SUPABASE_URL')}/functions/v1/push-notification`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                  },
                  body: JSON.stringify({
                    token: profile.fcm_token,
                    title: `Reminder: ${metadata.title}`,
                    body: `Task starts in ${reminderTime} minutes at ${timeFormatter.format(taskDate)}`,
                    data: {
                      type: 'task_reminder',
                      taskId: event.task_id.toString(),
                    },
                  }),
                }
              )

              if (!pushResponse.ok) {
                throw new Error(`Failed to send push notification: ${pushResponse.statusText}`)
              }

              console.log(`✅ Notification sent for task: ${metadata.title}`)
              processedEvents.push(event.id)
            } else {
              console.log(`❌ No FCM token found for user: ${event.user_id}`)
              processedEvents.push(event.id)
            }
          } else {
            console.log(`⏳ Not notification time yet. Waiting... (${Math.floor(timeUntilNotification / 1000)}s remaining)`)
          }
        }
      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error)
        processedEvents.push(event.id)
      }
    }

    // Update processed events
    if (processedEvents.length > 0) {
      const { error: updateError } = await supabase
        .from('notification_events')
        .update({ status: 'processed' })
        .in('id', processedEvents)

      if (updateError) {
        throw updateError
      }

      console.log(`✅ Marked ${processedEvents.length} events as processed`)
    }

    return new Response(
      JSON.stringify({ 
        message: `Processed ${processedEvents.length} notifications`,
        processedEvents 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error processing notifications:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
