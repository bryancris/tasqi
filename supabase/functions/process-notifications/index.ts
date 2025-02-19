
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
          const taskDate = new Date(`${metadata.date}T${metadata.start_time}`)
          const reminderTime = metadata.reminder_time || 15 // Default to 15 minutes if not set
          
          // Calculate when the notification should be sent
          const notificationTime = new Date(taskDate.getTime() - (reminderTime * 60 * 1000))
          
          console.log('Task:', metadata.title)
          console.log('Task time:', taskDate.toISOString())
          console.log('Reminder minutes:', reminderTime)
          console.log('Notification time:', notificationTime.toISOString())
          console.log('Current time:', now.toISOString())

          // Check if it's time to send the notification
          if (now >= notificationTime && now <= taskDate) {
            // Get user's FCM token
            const { data: profile } = await supabase
              .from('profiles')
              .select('fcm_token')
              .eq('id', event.user_id)
              .single()

            if (profile?.fcm_token) {
              // Call the push-notification function
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
                    body: `Task starts ${reminderTime} minutes from now at ${metadata.start_time}`,
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
          }
        }
      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error)
        // Mark failed events as processed to avoid repeated failures
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
