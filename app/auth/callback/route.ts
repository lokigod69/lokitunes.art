/**
 * OAuth callback handler - exchanges auth code for session
 */
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)

  const redirectUrl = new URL('/', requestUrl.origin)
  redirectUrl.search = requestUrl.search
  return NextResponse.redirect(redirectUrl)
}
