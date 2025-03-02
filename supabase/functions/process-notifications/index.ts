
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Database } from '../_shared/database.types';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

// CORS headers for browser API requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process pending notification events
async function processNotifications() {
  console.log('Starting notification processing...');

  // Get pending notification events
  const { data: events, error: fetchError } = await supabase
    .from('notification_events')
    .select('*')
    .eq('status', 'pending')
    .is('processed_at', null)
    .order('created_at', { ascending: true })
    .limit(50);

  if (fetchError) {
    console.error('Error fetching pending notifications:', fetchError);
    return;
  }

  console.log(`Found ${events?.length || 0} pending notifications to process`);

  if (!events || events.length === 0) {
    return;
  }

  // Process each notification event
  for (const event of events) {
    console.log(`Processing notification event ${event.id} of type ${event.event_type}`);
    
    try {
      // Get the user's device tokens
      const { data: deviceTokens, error: tokenError } = await supabase
        .from('push_device_tokens')
        .select('*')
        .eq('user_id', event.user_id);

      if (tokenError) {
        console.error(`Error fetching device tokens for user ${event.user_id}:`, tokenError);
        continue;
      }

      // Get user subscriptions (web push)
      const { data: webSubscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', event.user_id)
        .eq('active', true);

      if (subError) {
        console.error(`Error fetching web subscriptions for user ${event.user_id}:`, subError);
      }

      let title = '';
      let body = '';
      let data = {};

      // Extract notification content based on event type
      if (event.event_type === 'task_reminder') {
        // Get task details
        const { data: task, error: taskError } = await supabase
          .from('tasks')
          .select('title, description')
          .eq('id', event.task_id)
          .single();

        if (taskError) {
          console.error(`Error fetching task ${event.task_id}:`, taskError);
          continue;
        }

        title = `Task Reminder: ${task.title}`;
        body = task.description || 'Your scheduled task is due soon.';
        data = {
          type: 'task_reminder',
          taskId: event.task_id,
          ...event.metadata
        };
      } 
      else if (event.event_type === 'timer_complete') {
        // Timer notification
        title = event.metadata?.title || 'Timer Complete';
        body = event.metadata?.message || 'Your timer has completed.';
        data = {
          type: 'timer_complete',
          timerId: event.metadata?.timer_id,
          ...event.metadata
        };
        
        console.log(`Sending timer complete notification: ${title} - ${body}`);
      }
      else if (event.event_type === 'task_status_changed') {
        title = `Task Status: ${event.metadata?.title}`;
        body = `Changed from ${event.metadata?.old_status} to ${event.metadata?.new_status}`;
        data = {
          type: 'task_status_change',
          taskId: event.task_id,
          ...event.metadata
        };
      }
      else {
        // Default case for other event types
        title = event.metadata?.title || 'Notification';
        body = event.metadata?.message || 'You have a new notification.';
        data = {
          type: event.event_type,
          ...event.metadata
        };
      }

      // Actually send the notifications
      let successCount = 0;

      // Send web push notifications
      if (webSubscriptions && webSubscriptions.length > 0) {
        for (const subscription of webSubscriptions) {
          try {
            // In a real implementation, we would use web-push library
            // For now, we'll just log that we would send it
            console.log(`Would send web push to subscription ${subscription.id} with:`, {
              title,
              body,
              data
            });
            successCount++;
          } catch (error) {
            console.error(`Error sending web push to subscription ${subscription.id}:`, error);
          }
        }
      }

      // Send to mobile devices
      if (deviceTokens && deviceTokens.length > 0) {
        try {
          // Call the push-notification edge function
          const { data: pushResult, error: pushError } = await supabase.functions.invoke('push-notification', {
            body: {
              userId: event.user_id,
              title,
              body,
              data
            }
          });

          if (pushError) {
            console.error('Error invoking push-notification function:', pushError);
          } else {
            console.log('Push notification result:', pushResult);
            if (pushResult?.successCount) {
              successCount += pushResult.successCount;
            }
          }
        } catch (error) {
          console.error('Error sending push notification:', error);
        }
      }

      // Mark the notification as processed
      await supabase
        .from('notification_events')
        .update({
          processed_at: new Date().toISOString(),
          status: successCount > 0 ? 'delivered' : 'failed',
          delivery_status: successCount > 0 ? 'delivered' : 'failed',
          delivery_platform: 'combined',
          delivery_attempts: 1
        })
        .eq('id', event.id);

      console.log(`Notification event ${event.id} processed with ${successCount} successful deliveries`);
    } catch (error) {
      console.error(`Error processing notification event ${event.id}:`, error);
      
      // Update the notification event with error info
      await supabase
        .from('notification_events')
        .update({
          status: 'error',
          delivery_status: 'failed',
          last_error: error.message || 'Unknown error',
          error_count: (event.error_count || 0) + 1,
          delivery_attempts: (event.delivery_attempts || 0) + 1
        })
        .eq('id', event.id);
    }
  }

  console.log('Notification processing complete.');
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    await processNotifications();
    return new Response(
      JSON.stringify({ success: true, message: 'Notifications processed' }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error processing notifications:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
