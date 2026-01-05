'use client'

import type { OnboardingLanguage } from '@/lib/onboarding-content'
import { onboardingContent } from '@/lib/onboarding-content'

interface HowToRateScreenProps {
  language: OnboardingLanguage
}

export function HowToRateScreen({ language }: HowToRateScreenProps) {
  const screen = onboardingContent[language].screens.find((s) => s.id === 'howToRate')

  if (!screen) return null

  const lines = screen.body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-bone/20 bg-black/40 text-lg shadow-[0_0_14px_rgba(0,0,0,0.65)]">
          🧪
        </div>
        <div className="min-w-0 space-y-1">
          <h2 className="text-xl font-semibold text-bone tracking-tight">
            {screen.title}
          </h2>
          <div className="space-y-2">
            {lines.map((line, index) => (
              <p key={`${index}-${line}`} className="text-sm leading-relaxed text-bone/80">
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>

      {screen.bullets && screen.bullets.length > 0 && (
        <div className="rounded-xl border border-bone/20 bg-black/35 p-3">
          <ul className="space-y-2 text-sm text-bone/80">
            {screen.bullets.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-0.5 text-sm">👉</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {screen.highlights && screen.highlights.length > 0 && (
        <div className="space-y-3">
          {screen.highlights.map((highlight) => (
            <div
              key={highlight.title}
              className="rounded-xl border border-bone/20 bg-black/40 px-3 py-2 shadow-[0_0_12px_rgba(0,0,0,0.6)]"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base" aria-hidden="true">
                  {highlight.title.toLowerCase().includes('low') ||
                  highlight.title.toLowerCase().includes('nied')
                    ? '🧊'
                    : '🔥'}
                </span>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-voltage">
                  {highlight.title}
                </p>
              </div>
              <p className="text-xs text-bone/75 leading-relaxed">{highlight.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
