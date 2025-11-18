'use client'

import { useEffect, useState } from 'react'
import type { OnboardingLanguage } from '@/lib/onboarding-content'

const ONBOARDING_SEEN_KEY = 'lokitunes-onboarding-seen'
const ONBOARDING_LANGUAGE_KEY = 'lokitunes-onboarding-language'

interface UseOnboardingResult {
  shouldShow: boolean
  hasLoaded: boolean
  language: OnboardingLanguage
  setLanguage: (language: OnboardingLanguage) => void
  dismiss: () => void
  reset: () => void
}

export function useOnboarding(): UseOnboardingResult {
  const [hasSeen, setHasSeen] = useState<boolean | null>(null)
  const [language, setLanguageState] = useState<OnboardingLanguage>('en')

  useEffect(() => {
    if (typeof window === 'undefined') {
      setHasSeen(false)
      return
    }

    try {
      const seenValue = window.localStorage.getItem(ONBOARDING_SEEN_KEY)
      setHasSeen(seenValue === 'true')

      const storedLanguage = window.localStorage.getItem(ONBOARDING_LANGUAGE_KEY)
      if (storedLanguage === 'en' || storedLanguage === 'de') {
        setLanguageState(storedLanguage)
      }
    } catch {
      setHasSeen(false)
    }
  }, [])

  const persistSeen = (value: boolean) => {
    setHasSeen(value)
    if (typeof window === 'undefined') return

    try {
      if (value) {
        window.localStorage.setItem(ONBOARDING_SEEN_KEY, 'true')
      } else {
        window.localStorage.removeItem(ONBOARDING_SEEN_KEY)
      }
    } catch {
      // ignore storage errors
    }
  }

  const setLanguage = (next: OnboardingLanguage) => {
    setLanguageState(next)

    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(ONBOARDING_LANGUAGE_KEY, next)
    } catch {
      // ignore storage errors
    }
  }

  const dismiss = () => {
    persistSeen(true)
  }

  const reset = () => {
    persistSeen(false)
  }

  const hasLoaded = hasSeen !== null
  const shouldShow = hasSeen === false

  return {
    shouldShow,
    hasLoaded,
    language,
    setLanguage,
    dismiss,
    reset,
  }
}
