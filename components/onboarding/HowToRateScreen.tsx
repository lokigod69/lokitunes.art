'use client'

import type { OnboardingLanguage } from '@/lib/onboarding-content'
import { onboardingContent } from '@/lib/onboarding-content'

interface HowToRateScreenProps {
  language: OnboardingLanguage
}

export function HowToRateScreen({ language }: HowToRateScreenProps) {
  const screen = onboardingContent[language].screens.find((s) => s.id === 'howToRate')

  if (!screen) return null

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-bone tracking-tight">
          {screen.title}
        </h2>
        <p className="text-sm leading-relaxed text-bone/80 whitespace-pre-line">
          {screen.body}
        </p>
      </div>

      {screen.bullets && screen.bullets.length > 0 && (
        <ul className="space-y-1 text-sm text-bone/80 list-disc list-inside">
          {screen.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}

      {screen.highlights && screen.highlights.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {screen.highlights.map((highlight) => (
            <div
              key={highlight.title}
              className="rounded-lg border border-bone/20 bg-black/40 px-3 py-2 shadow-[0_0_12px_rgba(0,0,0,0.6)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-voltage mb-1">
                {highlight.title}
              </p>
              <p className="text-xs text-bone/75">{highlight.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
