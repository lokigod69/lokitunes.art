// Singleton Web Audio analyzer attached to the global <audio> element.

let audioContext: AudioContext | null = null
let analyserNode: AnalyserNode | null = null
let sourceNode: MediaElementAudioSourceNode | null = null
let connectedElement: HTMLAudioElement | null = null

function getOrCreateAudioContext(): AudioContext {
  if (audioContext) return audioContext

  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) {
    throw new Error('Web Audio API is not supported in this browser')
  }

  audioContext = new Ctx()
  return audioContext
}

function getOrCreateAnalyser(ctx: AudioContext): AnalyserNode {
  if (analyserNode) return analyserNode

  const analyser = ctx.createAnalyser()
  analyser.fftSize = 1024
  analyser.smoothingTimeConstant = 0.8
  analyserNode = analyser
  return analyser
}

export function ensureConnected(audioEl: HTMLAudioElement): AnalyserNode {
  if (!audioEl) {
    throw new Error('ensureConnected requires a valid HTMLAudioElement')
  }

  if (sourceNode && connectedElement && connectedElement !== audioEl) {
    throw new Error('Audio analyzer is already connected to a different <audio> element')
  }

  const ctx = getOrCreateAudioContext()
  const analyser = getOrCreateAnalyser(ctx)

  // Avoid creating a MediaElementAudioSourceNode while the context is suspended.
  // Some browsers require a user gesture to resume; creating the source too early
  // can have unpredictable routing behavior.
  if (!sourceNode && ctx.state === 'running') {
    connectedElement = audioEl
    sourceNode = ctx.createMediaElementSource(audioEl)
    sourceNode.connect(analyser)
    analyser.connect(ctx.destination)
  }

  return analyser
}

export function resumeContextIfNeeded(): Promise<void> {
  const ctx = audioContext ?? getOrCreateAudioContext()
  if (ctx.state !== 'suspended') return Promise.resolve()
  return ctx.resume().then(() => undefined)
}

export function getFrequencyData(target?: Uint8Array): Uint8Array | null {
  if (!analyserNode) return null

  const buffer = target ?? new Uint8Array(analyserNode.frequencyBinCount)
  analyserNode.getByteFrequencyData(buffer as unknown as Uint8Array<ArrayBuffer>)
  return buffer
}

export function getAnalyserNode(): AnalyserNode | null {
  return analyserNode
}
