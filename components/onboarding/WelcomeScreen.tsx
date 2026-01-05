'use client'

import type { OnboardingLanguage } from '@/lib/onboarding-content'
import { onboardingContent } from '@/lib/onboarding-content'

interface WelcomeScreenProps {
  language: OnboardingLanguage
}

export function WelcomeScreen({ language }: WelcomeScreenProps) {
  const screen = onboardingContent[language].screens.find((s) => s.id === 'welcome')

  if (!screen) return null

  const lines = screen.body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const icons = ['🤖', '🎛️', '🗑️', '⭐']

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-bone/20 bg-black/40 text-lg shadow-[0_0_14px_rgba(0,0,0,0.65)]">
          🎧
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-bone tracking-tight">
            {screen.title}
          </h2>
        </div>
      </div>

      <div className="space-y-3">
        {lines.map((line, index) => (
          <div key={`${index}-${line}`} className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-bone/15 bg-black/30 text-sm">
              {icons[index] ?? '•'}
            </div>
            <p className="text-sm leading-relaxed text-bone/80">
              {line}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
