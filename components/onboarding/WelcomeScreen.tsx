'use client'

import type { OnboardingLanguage } from '@/lib/onboarding-content'
import { onboardingContent } from '@/lib/onboarding-content'

interface WelcomeScreenProps {
  language: OnboardingLanguage
}

export function WelcomeScreen({ language }: WelcomeScreenProps) {
  const screen = onboardingContent[language].screens.find((s) => s.id === 'welcome')

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
