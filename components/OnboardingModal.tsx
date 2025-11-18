// Onboarding modal shell for first-time user tutorial
'use client'

import { useEffect, useRef, useState } from 'react'
import { onboardingContent, type OnboardingLanguage } from '@/lib/onboarding-content'
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen'
import { HowToRateScreen } from '@/components/onboarding/HowToRateScreen'
import { InteractiveTourScreen } from '@/components/onboarding/InteractiveTourScreen'

interface OnboardingModalProps {
  isOpen: boolean
  language: OnboardingLanguage
  onLanguageChange: (language: OnboardingLanguage) => void
  onDismiss: () => void
}

const TOTAL_SCREENS = 3

export function OnboardingModal({
  isOpen,
  language,
  onLanguageChange,
  onDismiss,
}: OnboardingModalProps) {
  const [currentScreen, setCurrentScreen] = useState(1)
  const [isMounted, setIsMounted] = useState(isOpen)
  const [isClosing, setIsClosing] = useState(false)
  const modalRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Handle mounting/unmounting with fade-out animation
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true)
      setIsClosing(false)

      if (typeof document !== 'undefined') {
        previousFocusRef.current = document.activeElement as HTMLElement | null
      }
    } else if (isMounted) {
      setIsClosing(true)
      const timeout = window.setTimeout(() => {
        setIsMounted(false)
        setIsClosing(false)
        if (previousFocusRef.current) {
          previousFocusRef.current.focus()
        }
      }, 200)

      return () => {
        window.clearTimeout(timeout)
      }
    }
  }, [isOpen, isMounted])

  useEffect(() => {
    if (isOpen) {
      setCurrentScreen(1)
    }
  }, [isOpen])

  // Focus the close button when modal becomes active
  useEffect(() => {
    if (!isMounted) return

    const id = window.setTimeout(() => {
      if (closeButtonRef.current) {
        closeButtonRef.current.focus()
      }
    }, 0)

    return () => window.clearTimeout(id)
  }, [isMounted])

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

  // Keyboard navigation (ESC to close, arrows to move between screens, Tab focus trap)
  useEffect(() => {
    if (!isMounted) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss()
        return
      }

      if (event.key === 'ArrowRight') {
        if (!isLastScreen) {
          setCurrentScreen((prev) => Math.min(TOTAL_SCREENS, prev + 1))
        }
        return
      }

      if (event.key === 'ArrowLeft') {
        if (currentScreen > 1) {
          setCurrentScreen((prev) => Math.max(1, prev - 1))
        }
        return
      }

      if (event.key === 'Tab') {
        const modal = modalRef.current
        if (!modal) return

        const focusable = modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )

        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        const target = event.target as HTMLElement

        if (event.shiftKey) {
          if (!modal.contains(target) || target === first) {
            event.preventDefault()
            last.focus()
          }
        } else {
          if (!modal.contains(target) || target === last) {
            event.preventDefault()
            first.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMounted, onDismiss, currentScreen, isLastScreen])

  const renderScreen = () => {
    switch (currentScreen) {
      case 1:
        return <WelcomeScreen language={language} />
      case 2:
        return <HowToRateScreen language={language} />
      case 3:
        return <InteractiveTourScreen language={language} />
      default:
        return null
    }
  }

  if (!isMounted) return null

  const isActive = isOpen && !isClosing

  const labels = onboardingContent[language]

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-200 ${
        isActive ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        className={`w-full max-w-xl mx-4 sm:mx-0 rounded-2xl bg-void border border-bone/30 p-5 sm:p-6 text-bone shadow-[0_0_40px_rgba(0,0,0,0.85)] transform transition-all duration-200 ${
          isActive
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-2 sm:translate-y-4 scale-95'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-end mb-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-wrap items-center gap-1 text-[11px] bg-black/40 border border-bone/20 rounded-full px-1 py-0.5">
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
              ref={closeButtonRef}
              className="text-bone/60 hover:text-bone cursor-pointer text-sm"
              aria-label="Close tutorial"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="min-h-[220px] mb-6">
          <div key={currentScreen} className="onboarding-screen-enter">
            {renderScreen()}
          </div>
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between">
          <div className="h-1 flex-1 mr-4 bg-bone/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-voltage transition-all"
              style={{ width: `${(currentScreen / TOTAL_SCREENS) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-bone/60">
              {currentScreen}/{TOTAL_SCREENS}
            </span>
            {!isLastScreen ? (
              <button
                type="button"
                onClick={goNext}
                className="px-4 py-1.5 rounded-full bg-voltage text-void text-sm font-medium hover:brightness-110 cursor-pointer"
              >
                {labels.nextButton}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartExploring}
                className="px-4 py-1.5 rounded-full bg-voltage text-void text-sm font-medium hover:brightness-110 cursor-pointer"
              >
                {labels.startButton}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
