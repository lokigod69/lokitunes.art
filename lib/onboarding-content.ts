export type OnboardingLanguage = 'en' | 'de'

export type OnboardingScreenId =
  | 'welcome'
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
  nextButton: string
  startButton: string
}

export const onboardingContent: Record<OnboardingLanguage, OnboardingContent> = {
  en: {
    screens: [
      {
        id: 'welcome',
        title: 'Welcome to LoKi Tunes',
        body:
          'This is a space for audio exploration and rating.\n\n' +
          "You're listening to raw versions of songs.\n\n" +
          'Your job? Help decide which ones are worth finishing.',
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
          'Orbs bring you to the music.\n\n' +
          'Click an orb → explore an album.\n' +
          'Click a version orb → play the song.\n' +
          'Rate while it plays.\n\n' +
          'See your rating progress on the homepage.\n\n' +
          'Happy listening! 🎵',
      },
    ],
    nextButton: 'Next →',
    startButton: 'Start Exploring →',
  },
  de: {
    screens: [
      {
        id: 'welcome',
        title: 'Willkommen bei LoKi Tunes',
        body:
          'Dies ist ein Raum für Audio-Exploration und Bewertungen.\n\n' +
          'Du hörst Rohversionen von Songs.\n\n' +
          'Deine Aufgabe: Mitentscheiden, welche Songs fertig produziert werden sollen.',
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
          'Orbs bringen dich zur Musik.\n\n' +
          'Klick auf einen Orb → erkunde ein Album.\n' +
          'Klick auf einen Versions-Orb → der Song spielt.\n' +
          'Bewerte, während er läuft.\n\n' +
          'Deinen Bewertungs-Fortschritt siehst du auf der Startseite.\n\n' +
          'Viel Spaß beim Hören! 🎵',
      },
    ],
    nextButton: 'Weiter →',
    startButton: "Los geht's →",
  },
}
