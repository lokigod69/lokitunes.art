'use client'

import { useEffect, useRef } from 'react'
import { useAudioStore } from '@/lib/audio-store'

export function AudioEngine() {
  const {
    currentVersion,
    isPlaying,
    currentTime,
    volume,
    setDuration,
    updateTime,
    next,
  } = useAudioStore()

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Set audio src when version changes - only if actually different
  useEffect(() => {
    if (!audioRef.current || !currentVersion?.audio_url) return

    const audio = audioRef.current
    
    // Only update src if it's actually different to avoid unnecessary reloads
    if (audio.src !== currentVersion.audio_url) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AudioEngine] Loading new audio:', currentVersion.label || currentVersion.id)
      }
      audio.src = currentVersion.audio_url
      audio.load()
    }
  }, [currentVersion])

  // Control playback when isPlaying or track changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying && currentVersion) {
      audio.play().catch(console.error)
    } else {
      audio.pause()
    }
  }, [isPlaying, currentVersion?.id])

  // Sync audio element time back into store - CRITICAL for UI updates!
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
        // Log occasionally to avoid console spam
        console.log('[AudioEngine] Time update:', audio.currentTime.toFixed(2))
      }
      updateTime(audio.currentTime)
    }
    
    const handleLoadedMetadata = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AudioEngine] Metadata loaded, duration:', audio.duration.toFixed(2))
      }
      setDuration(audio.duration)
    }
    
    const handleEnded = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AudioEngine] Track ended, moving to next')
      }
      next()
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [next, setDuration, updateTime])

  // Apply volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      if (process.env.NODE_ENV === 'development') {
        console.log('AudioEngine applied volume', volume)
      }
    }
  }, [volume])

  // React to external seeks (e.g. scrubber in GlobalAudioPlayer)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Avoid micro-jitter by only updating when meaningfully different
    if (Math.abs(audio.currentTime - currentTime) > 0.05) {
      audio.currentTime = currentTime
    }
  }, [currentTime])

  // Don't render if no audio URL
  if (!currentVersion?.audio_url) {
    return null
  }

  return (
    <audio
      ref={audioRef}
      src={currentVersion.audio_url}
      preload="metadata"
      className="hidden"
    />
  )
}
