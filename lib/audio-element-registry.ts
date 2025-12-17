// Stores a reference to the app's single global <audio> element for shared consumers (e.g. spectrum analyzer).

let audioElement: HTMLAudioElement | null = null

export function setAudioElement(el: HTMLAudioElement | null) {
  audioElement = el
}

export function getAudioElement(): HTMLAudioElement | null {
  return audioElement
}
