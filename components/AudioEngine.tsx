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

  // Load new track when currentVersion changes
  useEffect(() => {
    if (!audioRef.current || !currentVersion) return
    audioRef.current.load()
  }, [currentVersion?.id])

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

  // Sync audio element time back into store
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => updateTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => next()

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

  return (
    <audio
      ref={audioRef}
      src={currentVersion?.audio_url || ''}
      style={{ display: 'none' }}
    />
  )
}
