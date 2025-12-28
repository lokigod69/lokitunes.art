/**
 * OAuth callback handler - exchanges auth code for session
 */
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)

  const next = requestUrl.searchParams.get('next')
  const isSafeNext = !!next && next.startsWith('/') && !next.startsWith('//') && !next.includes('://')

  const redirectUrl = new URL(isSafeNext ? next : '/', requestUrl.origin)

  requestUrl.searchParams.forEach((value, key) => {
    if (key === 'next') return
    redirectUrl.searchParams.set(key, value)
  })
  return NextResponse.redirect(redirectUrl)
}
