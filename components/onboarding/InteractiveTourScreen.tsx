'use client'

import type { OnboardingLanguage } from '@/lib/onboarding-content'
import { onboardingContent } from '@/lib/onboarding-content'

interface InteractiveTourScreenProps {
  language: OnboardingLanguage
}

export function InteractiveTourScreen({ language }: InteractiveTourScreenProps) {
  const screen = onboardingContent[language].screens.find((s) => s.id === 'interactiveTour')

  if (!screen) return null

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-bone tracking-tight">
        {screen.title}
      </h2>
      <p className="text-sm leading-relaxed text-bone/80 whitespace-pre-line">
        {screen.body}
      </p>
    </div>
  )
}
