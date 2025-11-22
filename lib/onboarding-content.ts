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
          'Du hörst Songs in der Rohversion.\n\n' +
          'Du entscheidest welche Songs fertiggestellt werden.',
      },
      {
        id: 'howToRate',
        title: 'WIE?',
        body:
          'Bewerte das Potenzial, nicht die Makel.',
        highlights: [
          {
            title: 'Niedrige Bewertung',
            body: 'Nichts besonderes, Nicht mein Stil',
          },
          {
            title: 'Hohe Bewertung',
            body:
              '„Das kann was, bitte fertig produzieren!".\n\nDeine Bewertung beeinflusst, was entsteht.',
          },
        ],
      },
      {
        id: 'interactiveTour',
        title: 'So gehts!',
        body:
          'Orbs bringen dich zur Musik.\n\n' +
          'AlbumOrb klicken → erkunde ein Album.\n' +
          'VersionsOrb klicken → der Song spielt.\n' +
          'Bewerte, während er läuft.\n' +
          '(Rate)\n\n' +
          'Deinen Bewertungs-Fortschritt siehst du auf der Startseite.\n\n' +
          'Viel Spaß beim Hören! 🎵',
      },
    ],
    nextButton: 'Weiter →',
    startButton: "Los geht's →",
  },
}
