
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { Resend } from "npm:resend@2.0.0"

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
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"))
    const { sharedTaskId } = await req.json()
    
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
        task:tasks(*),
        shared_by:profiles!shared_tasks_shared_by_user_id_fkey(email),
        shared_with:profiles!shared_tasks_shared_with_user_id_fkey(email)
      `)
      .eq('id', sharedTaskId)
      .single()

    if (sharedTaskError) {
      console.error('Error fetching shared task:', sharedTaskError)
      throw new Error('Failed to fetch shared task details')
    }

    if (!sharedTask) {
      throw new Error('Shared task not found')
    }

    console.log('Retrieved shared task:', sharedTask)

    // Send email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'TASQI Tasks <onboarding@resend.dev>',
      to: sharedTask.shared_with.email,
      subject: 'Task Shared With You',
      html: `
        <h1>A Task Has Been Shared With You</h1>
        <p>${sharedTask.shared_by.email} has shared a task with you:</p>
        <h2>${sharedTask.task.title}</h2>
        <p>${sharedTask.task.description || ''}</p>
        <p>Click the link below to view the task:</p>
        <a href="https://tasqi.lovable.app/dashboard">View Task</a>
      `
    })

    if (emailError) {
      console.error('Error sending email:', emailError)
      throw emailError
    }

    console.log('Email sent successfully')

    // Update shared task status
    const { error: updateError } = await supabase
      .from('shared_tasks')
      .update({ notification_sent: true })
      .eq('id', sharedTaskId)

    if (updateError) {
      console.error('Error updating shared task status:', updateError)
      throw new Error('Failed to update shared task status')
    }

    console.log('Shared task status updated')

    return new Response(
      JSON.stringify({ success: true, data: emailData }),
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
