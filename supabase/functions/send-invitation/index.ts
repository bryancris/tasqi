
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
  console.log('📋 Fetching shared task details for ID:', sharedTaskId);
  
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
    console.error('❌ Error fetching shared task:', sharedTaskError);
    throw new Error(`Failed to fetch shared task details: ${sharedTaskError.message}`);
  }

  if (!sharedTask) {
    throw new Error('Shared task not found');
  }

  console.log('✅ Fetched shared task details:', sharedTask);
  return sharedTask;
}

async function createNotification(supabase: any, sharedTask: SharedTaskDetails) {
  try {
    console.log('📬 Creating notification for user:', sharedTask.shared_with_user_id);
    
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
      console.error('❌ Error creating notification:', notificationError);
      throw new Error('Failed to create notification');
    }

    console.log('✅ Notification created successfully');
  } catch (error) {
    console.error('❌ Error in createNotification:', error);
    throw error;
  }
}

async function updateSharedTaskStatus(supabase: any, sharedTaskId: string) {
  try {
    console.log('📝 Updating shared task status for ID:', sharedTaskId);
    
    const { error: updateError } = await supabase
      .from('shared_tasks')
      .update({ notification_sent: true })
      .eq('id', sharedTaskId);

    if (updateError) {
      console.error('❌ Error updating shared task status:', updateError);
      throw new Error(`Failed to update shared task status: ${updateError.message}`);
    }

    console.log('✅ Successfully updated shared task status');
  } catch (error) {
    console.error('❌ Error in updateSharedTaskStatus:', error);
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
    
    console.log('🚀 Starting send-invitation function with sharedTaskId:', sharedTaskId);
    
    if (!sharedTaskId) {
      throw new Error('sharedTaskId is required');
    }
    
    const supabase = await initializeSupabase();
    
    // Fetch shared task details first
    const sharedTask = await fetchSharedTaskDetails(supabase, sharedTaskId);
    
    // Create notification
    await createNotification(supabase, sharedTask);
    
    // Update shared task status
    await updateSharedTaskStatus(supabase, sharedTaskId);

    console.log('✅ Successfully processed shared task invitation');

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
    console.error('❌ Error processing shared task:', error);
    
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
