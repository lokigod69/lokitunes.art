'use client'

import { useEffect, useRef } from 'react'
import { useAudioStore } from '@/lib/audio-store'
import { setAudioElement } from '@/lib/audio-element-registry'
import { forceResumeAudioContext, isAudioRoutedThroughWebAudio } from '@/lib/audio-analyzer'
import { useMediaSession } from '@/hooks/useMediaSession'
import { devLog } from '@/lib/debug'

export default function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const lastLoadedUrl = useRef<string>('')  // Track last loaded URL to prevent double-load
  const isLoadingNewTrack = useRef(false)    // Prevent play during load
  const lastPauseTime = useRef<number>(0)    // Debounce pause calls
  const pauseDebounceMs = 100                // Minimum ms between pause calls
  const wasPlayingBeforeInterrupt = useRef(false)  // Track state for iOS interruption recovery
  
  const currentVersion = useAudioStore((state) => state.currentVersion)
  const isPlaying = useAudioStore((state) => state.isPlaying)
  const volume = useAudioStore((state) => state.volume)
  const setDuration = useAudioStore((state) => state.setDuration)
  const updateTime = useAudioStore((state) => state.updateTime)
  const handleTrackEnd = useAudioStore((state) => state.handleTrackEnd)
  const storeTime = useAudioStore((state) => state.currentTime)
  
  // 🍎 iOS BACKGROUND PLAYBACK: Enable Media Session API for lock screen controls
  // This is CRITICAL for iOS Safari background audio
  useMediaSession()

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

    const handleLoadedMetadata = async () => {
      devLog('[AudioEngine] Metadata loaded, duration:', audio.duration)
      setDuration(audio.duration)
      
      // Auto-save duration to database if missing
      const duration = audio.duration
      const currentVer = useAudioStore.getState().currentVersion
      
      // Only save if we have valid data and duration is missing
      if (duration && currentVer?.id && !isNaN(duration) && duration > 0) {
        if (!currentVer.duration_sec || currentVer.duration_sec <= 0) {
          try {
            const response = await fetch('/api/versions/update-duration', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                versionId: currentVer.id,
                duration: Math.round(duration)
              })
            })
            
            if (response.ok) {
              const result = await response.json()
              devLog(`[AudioEngine] Duration saved: ${result.duration}s`)
              // Update in-memory duration
              useAudioStore.getState().updateCurrentVersionDuration(Math.round(duration))
            }
          } catch (error) {
            // Silently fail - background optimization, not critical
            devLog('[AudioEngine] Failed to save duration:', error)
          }
        }
      }
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

  // 🍎 iOS AUDIO INTERRUPTION HANDLING
  // Handle phone calls, Siri, other apps taking audio focus
  // iOS fires 'pause' event when interrupted - we need to resume when interruption ends
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Track when audio was playing before an external pause (interruption)
    const handleExternalPause = () => {
      // Only track if our store thinks we should be playing
      // This distinguishes user pause from iOS interruption
      const storeState = useAudioStore.getState()
      if (storeState.isPlaying && audio.paused) {
        devLog('[AudioEngine] iOS interruption detected - audio paused externally')
        wasPlayingBeforeInterrupt.current = true
      }
    }

    // When audio can play again, resume if we were interrupted
    const handleCanPlayThrough = () => {
      if (wasPlayingBeforeInterrupt.current) {
        devLog('[AudioEngine] Resuming after iOS interruption')
        wasPlayingBeforeInterrupt.current = false
        audio.play().catch((err) => {
          devLog('[AudioEngine] Resume after interruption failed:', err)
        })
      }
    }

    // iOS-specific: Handle audio session interruption end
    const handlePlay = () => {
      // Reset interruption flag when playback successfully starts
      wasPlayingBeforeInterrupt.current = false
    }

    audio.addEventListener('pause', handleExternalPause)
    audio.addEventListener('canplaythrough', handleCanPlayThrough)
    audio.addEventListener('play', handlePlay)

    return () => {
      audio.removeEventListener('pause', handleExternalPause)
      audio.removeEventListener('canplaythrough', handleCanPlayThrough)
      audio.removeEventListener('play', handlePlay)
    }
  }, [])

  // 🍎 iOS AUDIO UNLOCK
  // iOS requires a user gesture to "unlock" audio playback
  // This one-time handler unlocks audio on first touch/click
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    let unlocked = false

    const unlockAudio = async () => {
      if (unlocked) return
      unlocked = true

      devLog('[AudioEngine] 🔓 Attempting iOS audio unlock on first interaction')

      try {
        // Create a silent audio context and resume it
        const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof window.AudioContext }).webkitAudioContext
        if (AudioContext) {
          const ctx = new AudioContext()
          if (ctx.state === 'suspended') {
            await ctx.resume()
            devLog('[AudioEngine] AudioContext resumed')
          }
          // Don't close - let it be reused by analyzer if needed
        }

        // Also "prime" the audio element with a silent play
        // This helps iOS recognize this element can produce audio
        const originalSrc = audio.src
        const originalTime = audio.currentTime
        const wasPlaying = !audio.paused

        // Only do silent prime if not already playing something
        if (!originalSrc) {
          // Create a tiny silent audio data URL
          audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'
          audio.volume = 0
          await audio.play().catch(() => {})
          audio.pause()
          audio.src = ''
          audio.volume = useAudioStore.getState().volume
        }

        devLog('[AudioEngine] ✅ iOS audio unlocked successfully')
      } catch (err) {
        devLog('[AudioEngine] iOS audio unlock error (non-fatal):', err)
      }

      // Remove listeners after first unlock
      document.removeEventListener('touchstart', unlockAudio)
      document.removeEventListener('touchend', unlockAudio)
      document.removeEventListener('click', unlockAudio)
    }

    // Listen for first user interaction
    document.addEventListener('touchstart', unlockAudio, { once: true, passive: true })
    document.addEventListener('touchend', unlockAudio, { once: true, passive: true })
    document.addEventListener('click', unlockAudio, { once: true })

    return () => {
      document.removeEventListener('touchstart', unlockAudio)
      document.removeEventListener('touchend', unlockAudio)
      document.removeEventListener('click', unlockAudio)
    }
  }, [])

  // 🍎 iOS AUDIO DEBUG
  // Log audio state on various events to help diagnose output issues
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const logAudioState = (event: string) => {
      devLog(`[AudioEngine] ${event}:`, {
        src: audio.src?.substring(0, 50),
        paused: audio.paused,
        volume: audio.volume,
        muted: audio.muted,
        readyState: audio.readyState,
        currentTime: audio.currentTime,
        duration: audio.duration,
      })
    }

    const onPlay = () => logAudioState('play')
    const onPlaying = () => logAudioState('playing')
    const onPause = () => logAudioState('pause')
    const onVolumeChange = () => logAudioState('volumechange')

    audio.addEventListener('play', onPlay)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('volumechange', onVolumeChange)

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('volumechange', onVolumeChange)
    }
  }, [])

  // 🍎 iOS BACKGROUND AUDIO FIX - ENHANCED
  // When audio is routed through Web Audio API (for visualizer), iOS suspends the
  // AudioContext when the screen locks. We must actively resume it to keep audio playing.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleVisibilityChange = async () => {
      const isHidden = document.visibilityState === 'hidden'
      const { isPlaying } = useAudioStore.getState()
      
      devLog('[AudioEngine] Visibility changed:', {
        visibilityState: document.visibilityState,
        isPlaying,
        audioRoutedThroughWebAudio: isAudioRoutedThroughWebAudio(),
        audioPaused: audio.paused,
      })

      // Always try to resume AudioContext on visibility return
      if (!isHidden) {
        if (isAudioRoutedThroughWebAudio()) {
          const resumed = await forceResumeAudioContext()
          devLog('[AudioEngine] AudioContext resume on visibility:', resumed)
        }
        
        // If should be playing but isn't, recover with small delay to let iOS settle
        if (isPlaying && audio.paused) {
          devLog('[AudioEngine] Attempting delayed recovery after visibility return')
          setTimeout(() => {
            const currentState = useAudioStore.getState()
            if (currentState.isPlaying && audio.paused) {
              devLog('[AudioEngine] Executing delayed recovery')
              audio.play().catch(err => {
                devLog('[AudioEngine] Delayed recovery failed:', err)
              })
            }
          }, 100)
        }
      }
    }

    // Handle page show (back/forward cache restoration)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        devLog('[AudioEngine] Page restored from bfcache')
        handleVisibilityChange()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', handlePageShow)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

  // 🍎 iOS BACKGROUND AUDIO: Periodic AudioContext health check - ENHANCED
  // iOS can suspend AudioContext at any time during background playback
  // This interval ensures we catch and fix suspensions quickly
  // Check every 5 seconds for efficiency while still catching issues
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    let intervalId: NodeJS.Timeout | null = null

    const startHealthCheck = () => {
      if (intervalId) return
      
      intervalId = setInterval(async () => {
        const { isPlaying, currentVersion } = useAudioStore.getState()
        
        // Only check if we should be playing
        if (!isPlaying || !currentVersion) return
        
        // Check if audio is actually playing
        if (audio.paused && !audio.ended) {
          devLog('[AudioEngine] Health check: Audio paused unexpectedly, attempting recovery')
          audio.play().catch((error) => {
            devLog('[AudioEngine] Health check recovery failed:', error)
          })
        }
        
        // Check if audio context is suspended (for Web Audio)
        if (isAudioRoutedThroughWebAudio()) {
          const wasResumed = await forceResumeAudioContext()
          if (wasResumed) {
            devLog('[AudioEngine] Health check: AudioContext was suspended, resumed')
            // Also ensure audio element is playing after context resume
            if (audio.paused) {
              audio.play().catch(() => {})
            }
          }
        }
      }, 5000) // Check every 5 seconds
    }

    const stopHealthCheck = () => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    // Start/stop based on playback state
    const unsubscribe = useAudioStore.subscribe((state) => {
      if (state.isPlaying) {
        startHealthCheck()
      } else {
        stopHealthCheck()
      }
    })

    // Initial check
    if (useAudioStore.getState().isPlaying) {
      startHealthCheck()
    }

    return () => {
      stopHealthCheck()
      unsubscribe()
    }
  }, [])

  // 🍎 NETWORK ERROR RECOVERY
  // Handle stalled/waiting events for network issues
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleStalled = () => {
      devLog('[AudioEngine] Audio stalled, attempting recovery')
      const currentTime = audio.currentTime
      
      // Try to recover by seeking slightly (forces buffer reload)
      if (Number.isFinite(currentTime)) {
        audio.currentTime = currentTime
        const { isPlaying } = useAudioStore.getState()
        if (isPlaying) {
          audio.play().catch((err) => {
            devLog('[AudioEngine] Stall recovery play failed:', err)
          })
        }
      }
    }

    const handleWaiting = () => {
      devLog('[AudioEngine] Audio waiting for data (buffering)')
    }

    audio.addEventListener('stalled', handleStalled)
    audio.addEventListener('waiting', handleWaiting)

    return () => {
      audio.removeEventListener('stalled', handleStalled)
      audio.removeEventListener('waiting', handleWaiting)
    }
  }, [])

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
