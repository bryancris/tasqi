
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

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
    
    console.log('Fetching shared task details for id:', sharedTaskId)

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

    if (!sharedTask) {
      console.error('Shared task not found for id:', sharedTaskId)
      throw new Error('Shared task not found')
    }

    console.log('Retrieved shared task:', {
      id: sharedTask.id,
      taskId: sharedTask.task_id,
      sharedWithEmail: sharedTask.shared_with?.email,
      sharedByEmail: sharedTask.shared_by?.email
    })

    if (!sharedTask.shared_with?.email) {
      console.error('No recipient email found for shared task:', sharedTask)
      throw new Error('Recipient email not found')
    }

    if (!sharedTask.tasks?.title) {
      console.error('No task details found for shared task:', sharedTask)
      throw new Error('Task details not found')
    }

    // Create notification for the recipient
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: sharedTask.shared_with_user_id,
        type: 'task_share',
        title: 'New Task Shared With You',
        message: `${sharedTask.shared_by.email} has shared a task with you: ${sharedTask.tasks.title}`,
        reference_type: 'task',
        reference_id: sharedTask.task_id.toString()
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      throw new Error('Failed to create notification')
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

    console.log('Notification created and shared task status updated')

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
