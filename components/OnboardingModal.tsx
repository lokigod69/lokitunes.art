// Onboarding modal shell for first-time user tutorial
'use client'

import { useEffect, useState } from 'react'
import type { OnboardingLanguage } from '@/lib/onboarding-content'

interface OnboardingModalProps {
  isOpen: boolean
  language: OnboardingLanguage
  onLanguageChange: (language: OnboardingLanguage) => void
  onDismiss: () => void
}

const TOTAL_SCREENS = 4

export function OnboardingModal({
  isOpen,
  language,
  onLanguageChange,
  onDismiss,
}: OnboardingModalProps) {
  const [currentScreen, setCurrentScreen] = useState(1)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onDismiss])

  useEffect(() => {
    if (isOpen) {
      setCurrentScreen(1)
    }
  }, [isOpen])

  if (!isOpen) return null

  const goNext = () => {
    setCurrentScreen((prev) => (prev < TOTAL_SCREENS ? prev + 1 : prev))
  }

  const handleStartExploring = () => {
    onDismiss()
  }

  const handleBackdropClick = () => {
    onDismiss()
  }

  const isLastScreen = currentScreen >= TOTAL_SCREENS

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-void border border-bone/30 p-6 text-bone shadow-[0_0_40px_rgba(0,0,0,0.85)]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-[0.18em] text-bone/60">
            Welcome Tutorial
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[11px] bg-black/40 border border-bone/20 rounded-full px-1 py-0.5">
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-0.5 rounded-full cursor-pointer text-[11px] ${
                  language === 'en' ? 'bg-bone text-void' : 'text-bone/70 hover:text-bone'
                }`}
              >
                🇬🇧 EN
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('de')}
                className={`px-2 py-0.5 rounded-full cursor-pointer text-[11px] ${
                  language === 'de' ? 'bg-bone text-void' : 'text-bone/70 hover:text-bone'
                }`}
              >
                🇩🇪 DE
              </button>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="text-bone/60 hover:text-bone cursor-pointer text-sm"
              aria-label="Close tutorial"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body placeholder - real screen components will be wired in Phase 3 */}
        <div className="min-h-[180px] mb-6">
          <p className="text-xs text-bone/50 mb-2">
            Screen {currentScreen} of {TOTAL_SCREENS}
          </p>
          <p className="text-sm text-bone/80">
            Onboarding content for this screen will be implemented in the next phase.
          </p>
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between">
          <div className="h-1 flex-1 mr-4 bg-bone/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-voltage transition-all"
              style={{ width: `${(currentScreen / TOTAL_SCREENS) * 100}%` }}
            />
          </div>
          {!isLastScreen ? (
            <button
              type="button"
              onClick={goNext}
              className="px-4 py-1.5 rounded-full bg-voltage text-void text-sm font-medium hover:brightness-110 cursor-pointer"
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartExploring}
              className="px-4 py-1.5 rounded-full bg-voltage text-void text-sm font-medium hover:brightness-110 cursor-pointer"
            >
              Start Exploring →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
