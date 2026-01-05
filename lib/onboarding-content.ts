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
          "You're listening to AI-generated versions of my own music — old, mostly unfinished songs run through the machine.\n" +
          'The output is well...decide for yourself!\n' +
          "What's trash? What has potential?\n" +
          'Share by rating.',
      },
      {
        id: 'howToRate',
        title: 'An experiment',
        body:
          "These tracks won't stay as is. Good ones will be finished, remixed, or get their own music video. Bad ones (most of them) disappear.\n" +
          'Your ratings decide which is which.\n' +
          'Be brutal in your evaluation, since only a few % will pass to the next stage.',
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
        title: 'Willkommen bei LokiTunes',
        body:
          'Du hörst KI-generierte Versionen meiner eigenen Musik — alte, größtenteils unfertige Songs, durch die Maschine gejagt.\n' +
          'Das Ergebnis ist nun ja... entscheide selbst!\n' +
          'Was ist Müll? Was hat Potenzial?\n' +
          'Teile es, indem du bewertest.',
      },
      {
        id: 'howToRate',
        title: 'Ein Experiment',
        body:
          'Diese Tracks bleiben nicht so, wie sie sind. Die guten werden fertiggestellt, geremixt oder bekommen ihr eigenes Musikvideo. Die schlechten (die meisten davon) verschwinden.\n' +
          'Deine Bewertungen entscheiden, was was ist.\n' +
          'Sei brutal in deiner Bewertung, denn nur wenige % schaffen es in die nächste Stufe.',
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
