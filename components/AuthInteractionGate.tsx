'use client'

// Blocks interactions when signed out by showing a Google sign-in modal.

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'
import { LogIn, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { signInWithGoogle } from '@/lib/auth'
import { useIsMobile } from '@/hooks/useMobileDetection'

interface AuthInteractionGateProps {
  children: ReactNode
}

export function AuthInteractionGate({ children }: AuthInteractionGateProps) {
  const { isAuthenticated, loading } = useAuth()
  const isMobile = useIsMobile(768)

  const [isOpen, setIsOpen] = useState(false)

  const shouldGate = useMemo(() => !loading && !isAuthenticated, [loading, isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      setIsOpen(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const triggerGate = useCallback(
    (event: any) => {
      if (!shouldGate) return

      const target = event?.target as HTMLElement | null
      if (target?.closest?.('[data-auth-gate-allow="true"]')) return

      event?.preventDefault?.()
      event?.stopPropagation?.()
      event?.nativeEvent?.stopImmediatePropagation?.()

      setIsOpen(true)
    },
    [shouldGate]
  )

  const handleKeyDownCapture = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!shouldGate) return
      if (event.key !== 'Enter' && event.key !== ' ') return

      const target = event.target as HTMLElement | null
      if (target?.closest?.('[data-auth-gate-allow="true"]')) return

      event.preventDefault()
      event.stopPropagation()
      ;(event.nativeEvent as any)?.stopImmediatePropagation?.()

      setIsOpen(true)
    },
    [shouldGate]
  )

  return (
    <div
      onClickCapture={triggerGate}
      onKeyDownCapture={handleKeyDownCapture}
      {...(!isMobile ? { onPointerDownCapture: triggerGate } : {})}
    >
      {children}

      {shouldGate && isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" data-auth-gate-allow="true">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            data-auth-gate-allow="true"
          />

          <div
            className="relative w-full max-w-md bg-void border border-bone/20 rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            data-auth-gate-allow="true"
          >
            <div className="flex items-center justify-between p-4 border-b border-bone/10" data-auth-gate-allow="true">
              <h2 className="text-lg font-semibold text-bone" data-auth-gate-allow="true">
                Sign in required
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close"
                data-auth-gate-allow="true"
              >
                <X className="w-5 h-5 text-bone" />
              </button>
            </div>

            <div className="p-4" data-auth-gate-allow="true">
              <p className="text-sm text-bone/70" data-auth-gate-allow="true">
                You can browse the site, but you need to sign in with Google to interact.
              </p>

              <div className="mt-4 flex flex-col gap-2" data-auth-gate-allow="true">
                <button
                  type="button"
                  onClick={() => signInWithGoogle()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-voltage/10 hover:bg-voltage/20 border border-voltage/30 text-voltage transition-colors cursor-pointer"
                  data-auth-gate-allow="true"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Sign In with Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-bone/80 transition-colors cursor-pointer"
                  data-auth-gate-allow="true"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
