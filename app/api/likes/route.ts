/**
 * Likes API routes - authenticated user can list, like, and unlike song versions.
 */
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getBearerToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!header) return null
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1] || null
}

function createAuthedSupabase(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  )
}

export async function GET(request: NextRequest) {
  try {
    const token = getBearerToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createAuthedSupabase(token)

    const { data, error } = await supabase
      .from('user_liked_versions')
      .select('*')
      .order('liked_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ likes: data || [] })
  } catch (error) {
    console.error('API error (GET /api/likes):', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createAuthedSupabase(token)

    const body = await request.json()
    const versionId = body?.versionId

    if (!versionId || typeof versionId !== 'string') {
      return NextResponse.json({ error: 'versionId required' }, { status: 400 })
    }

    const { data: userRes, error: userError } = await supabase.auth.getUser()
    const userId = userRes?.user?.id

    if (userError || !userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('liked_versions')
      .insert({
        user_id: userId,
        version_id: versionId,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already liked' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, like: data })
  } catch (error) {
    console.error('API error (POST /api/likes):', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = getBearerToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createAuthedSupabase(token)

    const body = await request.json()
    const versionId = body?.versionId

    if (!versionId || typeof versionId !== 'string') {
      return NextResponse.json({ error: 'versionId required' }, { status: 400 })
    }

    const { data: userRes, error: userError } = await supabase.auth.getUser()
    const userId = userRes?.user?.id

    if (userError || !userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { error } = await supabase
      .from('liked_versions')
      .delete()
      .eq('user_id', userId)
      .eq('version_id', versionId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error (DELETE /api/likes):', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
