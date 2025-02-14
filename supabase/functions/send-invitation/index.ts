
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

  if (!sharedTask) {
    throw new Error('Shared task not found');
  }

  console.log('Fetched shared task details:', sharedTask);
  return sharedTask;
}

async function createNotification(supabase: any, sharedTask: SharedTaskDetails) {
  try {
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
  } catch (error) {
    console.error('Error in createNotification:', error);
    throw error;
  }
}

async function sendPushNotification(supabase: any, sharedTask: SharedTaskDetails) {
  try {
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
        console.error('Push notification failed:', await response.text());
        throw new Error(`Failed to send push notification: ${response.statusText}`);
      }

      console.log('Push notification sent successfully');
    }
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
    // Don't throw here as push notifications are not critical
  }
}

async function updateSharedTaskStatus(supabase: any, sharedTaskId: string) {
  try {
    const { error: updateError } = await supabase
      .from('shared_tasks')
      .update({ notification_sent: true })
      .eq('id', sharedTaskId);

    if (updateError) {
      console.error('Error updating shared task status:', updateError);
      throw new Error(`Failed to update shared task status: ${updateError.message}`);
    }

    console.log('Successfully updated shared task status');
  } catch (error) {
    console.error('Error in updateSharedTaskStatus:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sharedTaskId } = await req.json();
    
    console.log('Starting send-invitation function with sharedTaskId:', sharedTaskId);
    
    if (!sharedTaskId) {
      throw new Error('sharedTaskId is required');
    }
    
    const supabase = await initializeSupabase();
    
    // Fetch shared task details first
    const sharedTask = await fetchSharedTaskDetails(supabase, sharedTaskId);
    
    // Create notification
    await createNotification(supabase, sharedTask);
    
    // Try to send push notification (non-critical)
    await sendPushNotification(supabase, sharedTask);
    
    // Update shared task status
    await updateSharedTaskStatus(supabase, sharedTaskId);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Invitation sent successfully'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error processing shared task:', error);
    
    // Return a more detailed error response
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.stack
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }
})
