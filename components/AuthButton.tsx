/**
 * Auth button - handles sign in/out and displays user info
 */
'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { signInWithGoogle, signOut } from '@/lib/auth'
import { LogIn, LogOut, User, Star } from 'lucide-react'
import { MyRatingsModal } from './MyRatingsModal'

interface AuthButtonProps {
  className?: string
}

export function AuthButton({ className }: AuthButtonProps) {
  const { user, loading, isAuthenticated } = useAuth()
  const [showRatings, setShowRatings] = useState(false)

  if (loading) return null

  if (isAuthenticated) {
    return (
      <>
        <div className={`flex items-center gap-2 ${className || ''}`}>
          {/* My Ratings button */}
          <button
            onClick={() => setShowRatings(true)}
            className="p-2 rounded-full bg-void/80 border border-voltage/30 hover:border-voltage transition-colors backdrop-blur"
            title="My Ratings"
          >
            <Star className="w-4 h-4 text-voltage" />
          </button>
          
          {/* User profile button */}
          <button
            onClick={() => setShowRatings(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-void/80 border border-bone/30 hover:border-bone/60 transition-colors backdrop-blur"
          >
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <User className="w-4 h-4 text-bone" />
            )}
            <span className="text-sm text-bone truncate max-w-[100px]">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
            </span>
          </button>
          
          {/* Sign out button */}
          <button
            onClick={() => signOut()}
            className="p-2 rounded-full bg-void/80 border border-bone/30 hover:border-red-500/60 hover:text-red-400 transition-colors backdrop-blur"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <MyRatingsModal
          isOpen={showRatings}
          onClose={() => setShowRatings(false)}
        />
      </>
    )
  }

  return (
    <button
      onClick={() => signInWithGoogle()}
      className={`flex items-center gap-2 px-4 py-2 rounded-full bg-void/80 border border-voltage/30 hover:border-voltage hover:bg-voltage/10 transition-colors backdrop-blur ${className || ''}`}
    >
      <LogIn className="w-4 h-4 text-voltage" />
      <span className="text-sm text-bone">Sign in</span>
    </button>
  )
}
