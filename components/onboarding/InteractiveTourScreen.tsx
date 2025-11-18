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
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-bone tracking-tight">
          {screen.title}
        </h2>
        <p className="text-sm leading-relaxed text-bone/80 whitespace-pre-line">
          {screen.body}
        </p>
      </div>

      {screen.highlights && screen.highlights.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {screen.highlights.map((highlight) => (
            <div
              key={highlight.title}
              className="relative rounded-xl border border-bone/20 bg-black/40 px-3 py-3 shadow-[0_0_18px_rgba(0,0,0,0.7)] overflow-hidden"
            >
              {/* Simple mockup: neon frame + label */}
              <div className="absolute inset-0 border border-voltage/40 rounded-xl pointer-events-none" />
              <div className="relative space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-voltage">
                  {highlight.title}
                </p>
                <p className="text-xs text-bone/75">{highlight.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
