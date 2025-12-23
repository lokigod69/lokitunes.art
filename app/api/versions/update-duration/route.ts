import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to auto-save audio duration when a track is played.
 * Uses service role to bypass RLS policies for database writes.
 */

const getServiceClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase credentials')
  }
  
  return createClient(url, serviceKey)
}

export async function POST(request: NextRequest) {
  try {
    const { versionId, duration } = await request.json()
    
    // Validate input
    if (!versionId || typeof versionId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid versionId' }, 
        { status: 400 }
      )
    }
    
    if (!duration || typeof duration !== 'number' || duration <= 0) {
      return NextResponse.json(
        { error: 'Invalid duration' }, 
        { status: 400 }
      )
    }
    
    const supabase = getServiceClient()
    
    // First check if duration is already set (avoid unnecessary updates)
    const { data: existing } = await supabase
      .from('song_versions')
      .select('duration_sec')
      .eq('id', versionId)
      .single()
    
    // Only update if duration is missing or zero
    if (existing && existing.duration_sec && existing.duration_sec > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Duration already set',
        duration: existing.duration_sec
      })
    }
    
    // Update duration
    const { error } = await supabase
      .from('song_versions')
      .update({ duration_sec: Math.round(duration) })
      .eq('id', versionId)
    
    if (error) {
      console.error('[update-duration] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update duration' }, 
        { status: 500 }
      )
    }
    
    console.log(`[update-duration] Saved duration for ${versionId}: ${Math.round(duration)}s`)
    
    return NextResponse.json({ 
      success: true,
      duration: Math.round(duration)
    })
    
  } catch (error) {
    console.error('[update-duration] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
