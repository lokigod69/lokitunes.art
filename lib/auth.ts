/**
 * Authentication utilities for Google OAuth via Supabase
 */
import { supabase } from './supabase'

export async function signInWithGoogle() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '')

  const nextPath = typeof window !== 'undefined'
    ? `${window.location.pathname}${window.location.search}`
    : ''

  const redirectTo = nextPath
    ? `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`
    : `${siteUrl}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo
    }
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
