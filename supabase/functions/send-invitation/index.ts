
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { sharedTaskId } = await req.json()
    
    console.log('Starting send-invitation function with sharedTaskId:', sharedTaskId)
    
    if (!sharedTaskId) {
      console.error('No sharedTaskId provided');
      throw new Error('sharedTaskId is required');
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get shared task details along with task info and user profiles
    const { data: sharedTask, error: sharedTaskError } = await supabase
      .from('shared_tasks')
      .select(`
        *,
        tasks:task_id (*),
        shared_by:shared_by_user_id (email),
        shared_with:shared_with_user_id (email)
      `)
      .eq('id', sharedTaskId)
      .single()

    if (sharedTaskError) {
      console.error('Error fetching shared task:', sharedTaskError)
      throw new Error(`Failed to fetch shared task details: ${sharedTaskError.message}`)
    }

    // Create notification for the recipient
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: sharedTask.shared_with_user_id,
        title: 'New Task Shared With You',
        message: `${sharedTask.shared_by.email} has shared a task with you: ${sharedTask.tasks.title}`,
        type: 'task_share',
        reference_id: sharedTask.task_id.toString(),
        reference_type: 'task'
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      throw new Error('Failed to create notification')
    }

    // Get push subscription for the recipient
    const { data: pushSubscription, error: subscriptionError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', sharedTask.shared_with_user_id)
      .single()

    if (subscriptionError) {
      console.log('No push subscription found for user')
    } else if (pushSubscription) {
      // Send push notification using the push-notification function
      try {
        const response = await fetch(
          `${supabaseUrl}/functions/v1/push-notification`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
              subscription: {
                endpoint: pushSubscription.endpoint,
                keys: pushSubscription.auth_keys
              },
              title: 'New Shared Task',
              message: `${sharedTask.shared_by.email} has shared "${sharedTask.tasks.title}" with you`
            })
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to send push notification: ${response.statusText}`)
        }

        console.log('Push notification sent successfully')
      } catch (error) {
        console.error('Error sending push notification:', error)
      }
    }

    // Update shared task status
    const { error: updateError } = await supabase
      .from('shared_tasks')
      .update({ notification_sent: true })
      .eq('id', sharedTaskId)

    if (updateError) {
      console.error('Error updating shared task status:', updateError)
      throw new Error('Failed to update shared task status')
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing shared task:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
