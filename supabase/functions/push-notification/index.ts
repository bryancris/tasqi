import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const FIREBASE_ADMIN_CONFIG = JSON.parse(Deno.env.get('FIREBASE_ADMIN_CONFIG') || '{}');

interface PushEvent {
  type: 'task_reminder' | 'task_shared' | 'task_status_changed';
  task_id: number;
  user_id: string;
  metadata: {
    title: string;
    date?: string;
    start_time?: string;
    end_time?: string;
    [key: string]: any;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const event: PushEvent = await req.json();
    
    console.log('Received push notification event:', JSON.stringify(event, null, 2));

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', event.user_id);

    if (subError) {
      throw subError;
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions for user ${event.user_id}`);

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for user');
      return new Response(
        JSON.stringify({ message: 'No push subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Firebase Admin if we have native subscriptions
    const hasNativeSubscriptions = subscriptions.some(sub => 
      sub.platform === 'android' || sub.platform === 'ios'
    );

    let firebaseAdmin;
    if (hasNativeSubscriptions) {
      console.log('Initializing Firebase Admin for native notifications');
      const { initializeApp, credential } = await import('https://esm.sh/firebase-admin@11.10.1/app');
      const { getMessaging } = await import('https://esm.sh/firebase-admin@11.10.1/messaging');
      
      try {
        firebaseAdmin = initializeApp({
          credential: credential.cert(FIREBASE_ADMIN_CONFIG)
        }, 'push-notification-function');
      } catch (error) {
        if (error.code !== 'app/duplicate-app') {
          throw error;
        }
        console.log('Firebase app already initialized');
      }
    }

    const title = 'Task Reminder';
    let body = '';
    
    switch (event.type) {
      case 'task_reminder':
        body = `Reminder: "${event.metadata.title}" ${
          event.metadata.start_time 
            ? `starts at ${event.metadata.start_time}` 
            : 'is due today'
        }`;
        break;
      case 'task_shared':
        body = `A task has been shared with you: "${event.metadata.title}"`;
        break;
      case 'task_status_changed':
        body = `Task "${event.metadata.title}" status changed to ${event.metadata.new_status}`;
        break;
    }

    console.log('Preparing to send notification:', { title, body });

    // Send to each subscription
    for (const subscription of subscriptions) {
      try {
        if (subscription.platform === 'android' || subscription.platform === 'ios') {
          if (!firebaseAdmin) {
            console.error('Firebase Admin not initialized for native notification');
            continue;
          }

          console.log(`Sending FCM notification to ${subscription.platform} device:`, subscription.device_token);
          
          const message = {
            token: subscription.device_token,
            notification: {
              title,
              body,
            },
            android: {
              priority: 'high',
              notification: {
                channelId: 'task_reminders',
                priority: 'high',
                defaultSound: true,
                defaultVibrateTimings: true,
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                },
              },
            },
          };

          const { getMessaging } = await import('https://esm.sh/firebase-admin@11.10.1/messaging');
          const response = await getMessaging().send(message);
          console.log('Successfully sent FCM message:', response);
        } else {
          console.log('Sending web push notification');
          const payload = JSON.stringify({
            title: title,
            body: body,
          });
  
          await fetch(subscription.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: payload,
          });
  
          console.log('Web push notification sent');
        }
      } catch (error) {
        console.error(`Error sending to subscription ${subscription.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in push notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
