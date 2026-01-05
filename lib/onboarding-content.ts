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
          "Some will surprise you. Most won't.\n" +
          'Help me separate the gems from the junk.\n' +
          'Rate what you hear.',
      },
      {
        id: 'howToRate',
        title: 'A living experiment',
        body:
          "Nothing here is final. Strong versions get finished, remixed, or turned into videos.\n" +
          'The weak ones vanish.\n' +
          'Your ratings decide what survives — so be honest. Only a few make it to the next round.',
      },
      {
        id: 'interactiveTour',
        title: 'How it works',
        body:
          "Orbs are your shortcuts to the music.\n\n" +
          'Click an album orb → open the album.\n' +
          'Click a version orb → play that take.\n' +
          'Rate while it plays.\n\n' +
          "On the homepage you can track what you've already rated.\n\n" +
          'Enjoy.\n',
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
          'Du hörst KI-generierte Versionen meiner eigenen Songs — alte Ideen und unfertige Tracks, einmal durch die Maschine gedreht.\n' +
          'Manches wird dich überraschen. Vieles eher nicht.\n' +
          'Hilf mir, Perlen von Ausschuss zu trennen.\n' +
          'Bewerte, was du hörst.',
      },
      {
        id: 'howToRate',
        title: 'Ein laufendes Experiment',
        body:
          'Nichts hier ist final. Gute Versionen werden fertiggestellt, geremixt oder bekommen ein Video.\n' +
          'Schwache fliegen raus.\n' +
          'Deine Bewertungen entscheiden, was bleibt — also sei ehrlich. Nur wenige schaffen es in die nächste Runde.',
      },
      {
        id: 'interactiveTour',
        title: 'So funktioniert’s',
        body:
          'Die Orbs sind deine Abkürzung zur Musik.\n\n' +
          'Album-Orb klicken → Album öffnen.\n' +
          'Versions-Orb klicken → diese Version abspielen.\n' +
          'Währenddessen bewerten.\n\n' +
          'Auf der Startseite siehst du, was du schon bewertet hast.\n\n' +
          'Viel Spaß!\n',
      },
    ],
    nextButton: 'Weiter →',
    startButton: "Los geht's →",
  },
}
