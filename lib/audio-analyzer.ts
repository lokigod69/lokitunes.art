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

  const ctx = getOrCreateAudioContext()
  const analyser = getOrCreateAnalyser(ctx)

  // If connected to a different element, disconnect and reconnect
  if (sourceNode && connectedElement && connectedElement !== audioEl) {
    try {
      sourceNode.disconnect()
    } catch {
      // Already disconnected
    }
    sourceNode = null
    connectedElement = null
  }

  // Avoid creating a MediaElementAudioSourceNode while the context is suspended.
  // Some browsers require a user gesture to resume; creating the source too early
  // can have unpredictable routing behavior.
  if (!sourceNode && ctx.state === 'running') {
    try {
      connectedElement = audioEl
      sourceNode = ctx.createMediaElementSource(audioEl)
      sourceNode.connect(analyser)
      analyser.connect(ctx.destination)
    } catch (e) {
      // MediaElementAudioSourceNode already created for this element - reuse it
      console.log('Audio analyzer: element already connected, reusing')
    }
  }

  return analyser
}

export function resumeContextIfNeeded(): Promise<void> {
  const ctx = audioContext ?? getOrCreateAudioContext()
  if (ctx.state !== 'suspended') return Promise.resolve()
  return ctx.resume().then(() => undefined)
}

// 🍎 iOS BACKGROUND AUDIO: Get current AudioContext for external management
export function getAudioContext(): AudioContext | null {
  return audioContext
}

// 🍎 iOS BACKGROUND AUDIO: Check if audio is routed through Web Audio API
export function isAudioRoutedThroughWebAudio(): boolean {
  return sourceNode !== null && connectedElement !== null
}

// 🍎 iOS BACKGROUND AUDIO: Aggressively resume AudioContext
// Call this when visibility changes or periodically during background playback
export async function forceResumeAudioContext(): Promise<boolean> {
  if (!audioContext) return false
  
  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume()
      console.log('[AudioAnalyzer] 🔊 AudioContext resumed from suspended state')
      return true
    } catch (err) {
      console.error('[AudioAnalyzer] Failed to resume AudioContext:', err)
      return false
    }
  }
  
  return audioContext.state === 'running'
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
