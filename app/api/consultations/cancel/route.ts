import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { consultationId } = await request.json()
    
    if (!consultationId) {
      return NextResponse.json({ error: 'Consultation ID is required' }, { status: 400 })
    }

    const supabase = await createServerClient()
    
    // Get user from request
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if consultation exists and belongs to user
    const { data: consultation, error: fetchError } = await supabase
      .from('consultation_requests')
      .select('*')
      .eq('id', consultationId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !consultation) {
      return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })
    }

    // Only allow cancellation of pending or paid consultations
    if (!['pending', 'paid'].includes(consultation.status)) {
      return NextResponse.json({ 
        error: 'Cannot cancel consultation with current status' 
      }, { status: 400 })
    }

    // Update consultation status to cancelled
    const { error: updateError } = await supabase
      .from('consultation_requests')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', consultationId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error cancelling consultation:', updateError)
      return NextResponse.json({ error: 'Failed to cancel consultation' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Consultation cancelled successfully' 
    })

  } catch (error) {
    console.error('Error cancelling consultation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
