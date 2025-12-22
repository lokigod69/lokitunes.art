'use client'

import { useEffect, useRef } from 'react'
import { useAudioStore } from '@/lib/audio-store'
import { setAudioElement } from '@/lib/audio-element-registry'
import { devLog } from '@/lib/debug'

export default function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const lastLoadedUrl = useRef<string>('')  // Track last loaded URL to prevent double-load
  const isLoadingNewTrack = useRef(false)    // Prevent play during load
  const lastPauseTime = useRef<number>(0)    // Debounce pause calls
  const pauseDebounceMs = 100                // Minimum ms between pause calls
  
  const currentVersion = useAudioStore((state) => state.currentVersion)
  const isPlaying = useAudioStore((state) => state.isPlaying)
  const volume = useAudioStore((state) => state.volume)
  const setDuration = useAudioStore((state) => state.setDuration)
  const updateTime = useAudioStore((state) => state.updateTime)
  const handleTrackEnd = useAudioStore((state) => state.handleTrackEnd)
  const storeTime = useAudioStore((state) => state.currentTime)

  // IMPORTANT: Always render the audio element, just don't set src if no URL
  // This ensures event listeners are always attached

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.crossOrigin = 'anonymous'
    setAudioElement(audio)

    return () => {
      setAudioElement(null)
    }
  }, [])

  // Update src when version changes
  // FIX: Use ref to track last loaded URL instead of comparing audio.src (which returns absolute URL)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    
    const newSrc = currentVersion?.audio_url || ''
    
    // Only load if URL actually changed (prevents restart on re-renders)
    if (newSrc && newSrc !== lastLoadedUrl.current) {
      devLog('[AudioEngine] Loading new audio:', currentVersion?.label)
      isLoadingNewTrack.current = true
      lastLoadedUrl.current = newSrc
      audio.crossOrigin = 'anonymous'
      audio.src = newSrc
      audio.load()
      
      // Auto-play after load if isPlaying is true
      audio.oncanplay = () => {
        isLoadingNewTrack.current = false
        if (isPlaying && audio.paused) {
          audio.play().catch((err) => {
            console.error('[AudioEngine] Auto-play after load failed:', err)
          })
        }
        audio.oncanplay = null  // Clear handler
      }
    } else if (!newSrc) {
      lastLoadedUrl.current = ''
      isLoadingNewTrack.current = false
    }
  }, [currentVersion, isPlaying])

  // Play/pause control - ONLY for pause/resume, not initial load
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audio.src) return
    
    // Skip if we're loading a new track (handled by oncanplay above)
    if (isLoadingNewTrack.current) return

    if (isPlaying) {
      // Only call play() if actually paused (prevents restart issues)
      if (audio.paused) {
        audio.play().catch((err) => {
          console.error('[AudioEngine] Play failed:', err)
        })
      }
    } else {
      // Guard: skip if already paused
      if (audio.paused) return
      
      // Debounce: skip if we just paused recently (prevents stutter on mobile)
      const now = Date.now()
      if (now - lastPauseTime.current < pauseDebounceMs) {
        devLog('[AudioEngine] Skipping pause (debounced)')
        return
      }
      
      lastPauseTime.current = now
      audio.pause()
    }
  }, [isPlaying])  // Remove currentVersion - we don't want to re-trigger on track change

  // Volume control
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
  }, [volume])

  // Keep the audio element's currentTime in sync with the store.
  // This makes scrubbing in the GlobalAudioPlayer actually seek in the
  // underlying <audio> element instead of snapping back.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audio.src) return

    if (!Number.isFinite(storeTime)) return

    const diff = Math.abs(audio.currentTime - storeTime)
    // Only seek when there's a meaningful difference to avoid fighting
    // against the normal timeupdate events.
    if (diff > 0.1) {
      audio.currentTime = storeTime
    }
  }, [storeTime])

  // Event listeners - MUST run after audio element exists
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      console.warn('[AudioEngine] No audio element for event listeners')
      return
    }

    devLog('[AudioEngine] Attaching event listeners')

    const handleTimeUpdate = () => {
      updateTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      devLog('[AudioEngine] Metadata loaded, duration:', audio.duration)
      setDuration(audio.duration)
    }

    const handleEnded = () => {
      devLog('[AudioEngine] Track ended')
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
      devLog('[AudioEngine] Removing event listeners')
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
      crossOrigin="anonymous"
      preload="metadata"
      playsInline
      webkit-playsinline="true"
      className="hidden"
    />
  )
}
