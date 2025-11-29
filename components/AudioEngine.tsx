'use client'

import { useEffect, useRef } from 'react'
import { useAudioStore } from '@/lib/audio-store'

export default function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement>(null)
  
  const currentVersion = useAudioStore((state) => state.currentVersion)
  const isPlaying = useAudioStore((state) => state.isPlaying)
  const volume = useAudioStore((state) => state.volume)
  const setDuration = useAudioStore((state) => state.setDuration)
  const updateTime = useAudioStore((state) => state.updateTime)
  const handleTrackEnd = useAudioStore((state) => state.handleTrackEnd)

  // IMPORTANT: Always render the audio element, just don't set src if no URL
  // This ensures event listeners are always attached

  // Update src when version changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    
    const newSrc = currentVersion?.audio_url || ''
    
    if (newSrc && audio.src !== newSrc) {
      console.log('[AudioEngine] Loading new audio:', currentVersion?.label)
      audio.src = newSrc
      audio.load()
    }
  }, [currentVersion])

  // Play/pause control
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audio.src) return

    if (isPlaying) {
      audio.play().catch((err) => {
        console.error('[AudioEngine] Play failed:', err)
      })
    } else {
      audio.pause()
    }
  }, [isPlaying, currentVersion])

  // Volume control
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
  }, [volume])

  // Event listeners - MUST run after audio element exists
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      console.warn('[AudioEngine] No audio element for event listeners')
      return
    }

    console.log('[AudioEngine] Attaching event listeners')

    const handleTimeUpdate = () => {
      updateTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      console.log('[AudioEngine] Metadata loaded, duration:', audio.duration)
      setDuration(audio.duration)
    }

    const handleEnded = () => {
      console.log('[AudioEngine] Track ended')
      handleTrackEnd()
    }

    const handleError = (e: Event) => {
      console.error('[AudioEngine] Audio error:', e)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      console.log('[AudioEngine] Removing event listeners')
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - only run once on mount, functions are stable Zustand selectors

  // ALWAYS render the audio element (even without src)
  // This ensures the ref exists for event listeners
  return (
    <audio
      ref={audioRef}
      preload="metadata"
      className="hidden"
    />
  )
}
