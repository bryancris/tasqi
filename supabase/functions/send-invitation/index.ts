
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
    const { invitationId } = await req.json()
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('calendar_invitations')
      .select(`
        *,
        sender:profiles!calendar_invitations_sender_id_fkey(email)
      `)
      .eq('id', invitationId)
      .single()

    if (invitationError || !invitation) {
      throw new Error('Invitation not found')
    }

    // Send email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'TASQI Calendar <onboarding@resend.dev>',
      to: invitation.recipient_email,
      subject: 'Calendar Sharing Invitation',
      html: `
        <h1>You've been invited to share a calendar!</h1>
        <p>${invitation.sender.email} has invited you to share their calendar with ${invitation.permission_level} access.</p>
        <p>Click the link below to accept the invitation:</p>
        <a href="https://tasqi.lovable.app/accept-invite?id=${invitation.id}">Accept Invitation</a>
      `
    })

    if (emailError) {
      throw emailError
    }

    // Update invitation status
    await supabase
      .from('calendar_invitations')
      .update({ status: 'sent' })
      .eq('id', invitationId)

    return new Response(
      JSON.stringify({ success: true, data: emailData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing invitation:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
