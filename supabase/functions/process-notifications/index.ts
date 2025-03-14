
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import type { Database } from "../_shared/database.types.ts";

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

  const now = new Date();
  console.log(`Current server time: ${now.toISOString()}`);

  // Process each notification event
  for (const event of events) {
    console.log(`Processing notification event ${event.id} of type ${event.event_type}`);
    console.log(`Event metadata:`, event.metadata);
    
    try {
      // For snoozed notifications, check if it's time to show them
      if (event.event_type === 'task_reminder' && event.metadata?.snoozed === true) {
        // Parse notification date and time
        const snoozeDate = event.metadata?.date;
        const snoozeTime = event.metadata?.start_time;
        
        if (snoozeDate && snoozeTime) {
          const [hours, minutes] = snoozeTime.split(':').map(Number);
          const targetDate = new Date(snoozeDate);
          targetDate.setHours(hours, minutes, 0, 0);
          
          // If the target time is in the future, skip for now
          if (targetDate > now) {
            console.log(`Snoozed notification ${event.id} is scheduled for ${targetDate.toISOString()}, skipping for now`);
            continue;
          }
        }
      }
      // Handle task reminders that need to be sent based on reminder_time
      else if (event.event_type === 'task_reminder' && !event.metadata?.snoozed) {
        // Get task date and start time from metadata
        const taskDate = event.metadata?.date;
        const taskStartTime = event.metadata?.start_time;
        
        // CRITICAL FIX: Be extremely explicit and careful with reminder_time handling
        // Default to 0 ("At start time") if not specified
        let reminderTime = 0; 
        
        if (event.metadata?.reminder_time !== undefined) {
          // Convert from different possible types
          if (typeof event.metadata.reminder_time === 'number') {
            reminderTime = event.metadata.reminder_time;
          } else if (typeof event.metadata.reminder_time === 'string') {
            // Handle "0" as a string explicitly
            if (event.metadata.reminder_time === "0") {
              reminderTime = 0;
              console.log(`⚡ Explicit string "0" found - correctly setting to 0 (At start time)`);
            } else {
              const parsed = parseInt(event.metadata.reminder_time, 10);
              if (!isNaN(parsed)) {
                reminderTime = parsed;
              }
            }
          }
          
          // Always log the final reminderTime value for debugging
          console.log(`⚡ Final reminderTime value: ${reminderTime} (${reminderTime === 0 ? "At start time" : reminderTime + " minutes before"})`);
        } else {
          console.log(`⚡ No reminder_time in metadata, defaulting to 0 (At start time)`);
        }
        
        console.log(`Task reminder details: date=${taskDate}, time=${taskStartTime}, reminder=${reminderTime} (from metadata: ${JSON.stringify(event.metadata?.reminder_time)})`);
        
        if (taskDate && taskStartTime) {
          // Parse the time for the task
          const [hours, minutes] = taskStartTime.split(':').map(Number);
          const taskDateTime = new Date(taskDate);
          taskDateTime.setHours(hours, minutes, 0, 0);
          
          // Calculate when the notification should be sent based on reminderTime
          const notificationTime = new Date(taskDateTime);
          
          // Only adjust notification time if reminderTime > 0 (not "At start time")
          if (reminderTime > 0) {
            notificationTime.setMinutes(notificationTime.getMinutes() - reminderTime);
            console.log(`⏰ Advance reminder: ${reminderTime} minutes before task time`);
          } else {
            console.log(`⏰ "At start time" notification (reminderTime=${reminderTime})`);
          }
          
          // Enhanced logging for debugging reminder time issues
          console.log(`Task ${event.task_id} notification timing details:`);
          console.log(`- Reminder time: ${reminderTime} minutes before (0 = "At start time")`);
          console.log(`- Task start time: ${taskDateTime.toISOString()}`);
          console.log(`- Notification time: ${notificationTime.toISOString()}`);
          console.log(`- Current time: ${now.toISOString()}`);
          
          // INCREASED window size for all notifications to ensure they're not missed
          const windowSizeMs = 15 * 60 * 1000; // 15 minutes window (increased from 10)
          
          if (reminderTime === 0) {
            // For "At start time" notifications, check if we're within the window of the actual start time
            const timeDiffMs = Math.abs(taskDateTime.getTime() - now.getTime());
            console.log(`- "At start time" notification with time diff: ${timeDiffMs/1000/60} minutes from exact start time`);
            
            if (timeDiffMs > windowSizeMs) {
              console.log(`Task reminder ${event.id} has "At start time" setting but is outside the ${windowSizeMs/1000/60} minute window, skipping for now`);
              continue;
            } else {
              console.log(`✅ Task reminder ${event.id} with "At start time" is due NOW - within window!`);
            }
          } else {
            // For advance reminders, check if notification time is approaching or passed
            const timeDiffMs = notificationTime.getTime() - now.getTime();
            console.log(`- Advance reminder with time diff: ${timeDiffMs/1000/60} minutes until notification time`);
            
            // If notification time is in the past or within the window, proceed
            if (timeDiffMs > windowSizeMs) {
              console.log(`Task reminder ${event.id} not due yet. Scheduled for ${notificationTime.toISOString()}`);
              continue;
            } else {
              console.log(`✅ Task reminder ${event.id} with ${reminderTime} min advance notice is due NOW!`);
            }
          }
        }
      }
      
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
        // If this is a snoozed notification, use the metadata directly
        if (event.metadata?.snoozed === true) {
          title = `Task Reminder: ${event.metadata.title}`;
          body = event.metadata.message || 'Your snoozed task reminder is due.';
          data = {
            type: 'task_reminder',
            taskId: event.task_id,
            snoozed: true,
            ...event.metadata
          };
        } else {
          // Get task details for regular reminders
          const { data: task, error: taskError } = await supabase
            .from('tasks')
            .select('title, description, reminder_time')
            .eq('id', event.task_id)
            .single();

          if (taskError) {
            console.error(`Error fetching task ${event.task_id}:`, taskError);
            continue;
          }

          // CRITICAL FIX: Get reminder_time directly from the database and process it correctly
          let reminderTimeForMessage = 0;
          
          // Explicit handling for reminder_time
          if (task?.reminder_time !== undefined && task?.reminder_time !== null) {
            if (typeof task.reminder_time === 'number') {
              reminderTimeForMessage = task.reminder_time;
            } else if (task.reminder_time !== null) {
              // Handle string "0" case explicitly
              if (task.reminder_time === "0") {
                reminderTimeForMessage = 0;
              } else {
                const parsed = parseInt(String(task.reminder_time), 10);
                if (!isNaN(parsed)) {
                  reminderTimeForMessage = parsed;
                }
              }
            }
          }
          
          console.log(`Using reminder_time=${reminderTimeForMessage} for notification message (raw value from DB: ${JSON.stringify(task?.reminder_time)})`);

          // Include information about whether this is an "at start time" notification
          const isAtStartTime = reminderTimeForMessage === 0;
          
          title = `Task Reminder: ${task.title}`;
          body = task.description || `Your scheduled task is due ${isAtStartTime ? 'now' : 'soon'}.`;
          data = {
            type: 'task_reminder',
            taskId: event.task_id,
            isAtStartTime: isAtStartTime,
            reminderTime: reminderTimeForMessage,  // Pass the actual reminder time to the notification
            ...event.metadata
          };
        }
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
      
      console.log(`Preparing to send notification: "${title}" - "${body}"`);
      console.log(`- Web subscriptions: ${webSubscriptions?.length || 0}`);
      console.log(`- Device tokens: ${deviceTokens?.length || 0}`);

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
          console.log(`Calling push-notification edge function for user ${event.user_id}`);
          
          // Call the push-notification edge function
          const { data: pushResult, error: pushError } = await supabase.functions.invoke('push-notification', {
            body: {
              userId: event.user_id,
              title,
              body,
              data,
              notificationEventId: event.id
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
      
      console.log(`Notification processing complete, success count: ${successCount}`);

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
