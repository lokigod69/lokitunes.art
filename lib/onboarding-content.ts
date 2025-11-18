export type OnboardingLanguage = 'en' | 'de'

export type OnboardingScreenId =
  | 'welcome'
  | 'whatYoureHearing'
  | 'howToRate'
  | 'interactiveTour'

export interface OnboardingHighlight {
  title: string
  body: string
}

export interface OnboardingScreenContent {
  id: OnboardingScreenId
  title: string
  body: string
  bullets?: string[]
  highlights?: OnboardingHighlight[]
}

export interface OnboardingContent {
  screens: OnboardingScreenContent[]
}

export const onboardingContent: Record<OnboardingLanguage, OnboardingContent> = {
  en: {
    screens: [
      {
        id: 'welcome',
        title: 'Welcome to LoKi Tunes',
        body:
          'This is a space for audio exploration and rating.\n\n' +
          "You're listening to raw versions of songs — unfinished, unpolished, but full of potential. Some are 90% there, others need major work.\n\n" +
          'Your job? Help decide which ones are worth finishing.',
      },
      {
        id: 'whatYoureHearing',
        title: "What am I listening to?",
        body:
          "These aren't final releases — they're possible release versions.\n\n" +
          'Think of them as raw diamonds. The core melody, vocals, and vibe are here, but they need refinement: better mixing, arrangement, polish.\n\n' +
          "Some tracks might sound rough. That's intentional. We're testing the foundation, not the finish.",
      },
      {
        id: 'howToRate',
        title: 'How should I rate?',
        body: "Don't judge technical quality. Judge potential.\n\nAsk yourself:",
        bullets: [
          'Does this evoke emotion?',
          'Do I like the style or vibe?',
          'Would I listen to a finished version of this?',
        ],
        highlights: [
          {
            title: 'Low rating',
            body: 'Means “Not my style” (not “This sounds unfinished”).',
          },
          {
            title: 'High rating',
            body: 'Means “This has potential, finish it!”. Your ratings help decide what gets created.',
          },
        ],
      },
      {
        id: 'interactiveTour',
        title: 'How it works',
        body:
          'A quick visual tour of how to explore albums, listen to versions, and rate them.',
        highlights: [
          {
            title: 'Orb field',
            body: 'These orbs are albums. Click one to explore.',
          },
          {
            title: 'Version orbs',
            body:
              'Inside an album, each orb is a different version of the same song — different styles, tempos, interpretations.',
          },
          {
            title: 'Player and rating',
            body:
              'While a song plays, use the global player to rate it and leave comments.',
          },
          {
            title: 'Rating progress',
            body:
              'Track how many versions you have rated. The more you rate, the more you shape what gets created.',
          },
        ],
      },
    ],
  },
  de: {
    screens: [
      {
        id: 'welcome',
        title: 'Willkommen bei LoKi Tunes',
        body:
          'Dies ist ein Bereich für Audio-Exploration und Bewertungen.\n\n' +
          'Du hörst Rohversionen von Songs – unfertig, unpoliert, aber voller Potenzial. Einige sind fast fertig, andere brauchen noch viel Arbeit.\n\n' +
          'Deine Aufgabe: Mitentscheiden, welche Songs fertig produziert werden sollen.',
      },
      {
        id: 'whatYoureHearing',
        title: 'Was höre ich hier?',
        body:
          'Das sind keine finalen Releases – es sind mögliche Release-Versionen.\n\n' +
          'Denk an Rohdiamanten: Melodie, Vocals und Vibe sind da, aber das Finetuning fehlt noch – besserer Mix, Arrangement, Feinschliff.\n\n' +
          'Manche Tracks klingen roh. Das ist Absicht. Wir testen das Fundament, nicht den letzten Glanz.',
      },
      {
        id: 'howToRate',
        title: 'Wie soll ich bewerten?',
        body:
          'Bewerte nicht die technische Qualität, sondern das Potenzial.\n\nFrag dich:',
        bullets: [
          'Löst das in mir etwas aus?',
          'Mag ich den Stil oder Vibe?',
          'Würde ich eine fertig produzierte Version davon hören?',
        ],
        highlights: [
          {
            title: 'Niedrige Bewertung',
            body: 'Heißt „Nicht mein Stil“ (nicht „klingt unfertig“).',
          },
          {
            title: 'Hohe Bewertung',
            body:
              'Heißt „Das hat Potenzial, bitte fertig produzieren!“. Deine Bewertung beeinflusst, was entsteht.',
          },
        ],
      },
      {
        id: 'interactiveTour',
        title: 'So funktioniert es',
        body:
          'Eine kurze visuelle Tour, wie du Alben erkundest, Versionen anhörst und bewertest.',
        highlights: [
          {
            title: 'Orb-Feld',
            body: 'Diese Orbs sind Alben. Klick auf einen Orb, um das Album zu öffnen.',
          },
          {
            title: 'Versions-Orbs',
            body:
              'Im Album ist jeder Orb eine andere Version desselben Songs – andere Styles, Tempi, Interpretationen.',
          },
          {
            title: 'Player und Bewertung',
            body:
              'Während ein Song läuft, kannst du im globalen Player bewerten und Kommentare hinterlassen.',
          },
          {
            title: 'Bewertungs-Fortschritt',
            body:
              'Verfolge, wie viele Versionen du schon bewertet hast. Je mehr du bewertest, desto stärker prägst du, was entsteht.',
          },
        ],
      },
    ],
  },
}
