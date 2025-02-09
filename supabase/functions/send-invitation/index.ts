
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SharedTaskDetails {
  id: string;
  task_id: string;
  shared_with_user_id: string;
  shared_by_user_id: string;
  tasks: {
    title: string;
  };
  shared_by: {
    email: string;
  };
  shared_with: {
    email: string;
  };
}

async function initializeSupabase() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseKey);
}

async function fetchSharedTaskDetails(supabase: any, sharedTaskId: string): Promise<SharedTaskDetails> {
  const { data: sharedTask, error: sharedTaskError } = await supabase
    .from('shared_tasks')
    .select(`
      *,
      tasks:task_id (*),
      shared_by:shared_by_user_id (email),
      shared_with:shared_with_user_id (email)
    `)
    .eq('id', sharedTaskId)
    .single();

  if (sharedTaskError) {
    console.error('Error fetching shared task:', sharedTaskError);
    throw new Error(`Failed to fetch shared task details: ${sharedTaskError.message}`);
  }

  console.log('Fetched shared task details:', sharedTask);
  return sharedTask;
}

async function createNotification(supabase: any, sharedTask: SharedTaskDetails) {
  const { error: notificationError } = await supabase
    .from('notifications')
    .insert({
      user_id: sharedTask.shared_with_user_id,
      title: 'New Task Shared With You',
      message: `${sharedTask.shared_by.email} has shared a task with you: ${sharedTask.tasks.title}`,
      type: 'task_share',
      reference_id: sharedTask.task_id.toString(),
      reference_type: 'task'
    });

  if (notificationError) {
    console.error('Error creating notification:', notificationError);
    throw new Error('Failed to create notification');
  }

  console.log('Notification created successfully');
}

async function sendPushNotification(supabase: any, sharedTask: SharedTaskDetails) {
  const { data: pushSubscription, error: subscriptionError } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', sharedTask.shared_with_user_id)
    .single();

  if (subscriptionError) {
    console.log('No push subscription found for user');
    return;
  }

  if (pushSubscription) {
    try {
      const response = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/push-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
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
      );

      if (!response.ok) {
        throw new Error(`Failed to send push notification: ${response.statusText}`);
      }

      console.log('Push notification sent successfully');
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }
}

async function updateSharedTaskStatus(supabase: any, sharedTaskId: string) {
  const { error: updateError } = await supabase
    .from('shared_tasks')
    .update({ notification_sent: true })
    .eq('id', sharedTaskId);

  if (updateError) {
    console.error('Error updating shared task status:', updateError);
    throw new Error('Failed to update shared task status');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sharedTaskId } = await req.json();
    
    console.log('Starting send-invitation function with sharedTaskId:', sharedTaskId);
    
    if (!sharedTaskId) {
      console.error('No sharedTaskId provided');
      throw new Error('sharedTaskId is required');
    }
    
    const supabase = await initializeSupabase();
    const sharedTask = await fetchSharedTaskDetails(supabase, sharedTaskId);
    
    await createNotification(supabase, sharedTask);
    await sendPushNotification(supabase, sharedTask);
    await updateSharedTaskStatus(supabase, sharedTaskId);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing shared task:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
