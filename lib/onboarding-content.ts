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
        title: 'Welcome to LokiTunes',
        body:
          "You're listening to AI-generated versions of my own songs — old ideas and unfinished tracks put through the machine.\n" +
          'Help me separate the gems from the junk.\n' +
          'Rate what you hear. ⭐',
      },
      {
        id: 'howToRate',
        title: 'A living experiment',
        body:
          "Nothing here is final. Strong versions get finished, remixed, or turned into videos.\n\n" +
          'The weak ones vanish.\n\n' +
          'Your ratings decide what survives.\n' +
          'Be brutally honest — no hard feelings.\n\n' +
          'Only a few make it to the next round. 🧪',
      },
      {
        id: 'interactiveTour',
        title: 'How it works',
        body:
          "Orbs are your entry to the music.\n\n" +
          'Click an album orb → open the album.\n' +
          'Click a version orb → play that take.\n' +
          'Rate while it plays.\n\n' +
          'Enjoy. 🎵',
      },
    ],
    nextButton: 'Next →',
    startButton: 'Start Exploring →',
  },
  de: {
    screens: [
      {
        id: 'welcome',
        title: 'Willkommen bei LokiTunes',
        body:
          'Du hörst KI-generierte Versionen meiner eigenen Songs — alte Ideen und unfertige Tracks, von der KI neu interpretiert.\n' +
          'Hilf mir, Perlen von Ausschuss zu trennen.\n' +
          'Bewerte, was du hörst. ⭐',
      },
      {
        id: 'howToRate',
        title: 'Ein laufendes Experiment',
        body:
          'Nichts hier ist final. Gute Versionen werden fertiggestellt, geremixt oder bekommen ein Video.\n\n' +
          'Schwache fliegen raus.\n\n' +
          'Deine Bewertungen entscheiden, was bleibt.\n' +
          'Sei brutal ehrlich — keine verletzten Gefühle.\n\n' +
          'Nur wenige schaffen es in die nächste Runde. 🧪',
      },
      {
        id: 'interactiveTour',
        title: 'So funktioniert’s',
        body:
          'Die Orbs sind dein Einstieg in die Musik.\n\n' +
          'Ein Orb öffnet ein Album.\n' +
          'Ein Versions-Orb spielt den Track.\n' +
          'Bewerte, während er läuft.\n\n' +
          'Viel Spaß! 🎵',
      },
    ],
    nextButton: 'Weiter →',
    startButton: "Los geht's →",
  },
}
