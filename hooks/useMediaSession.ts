/**
 * Media Session API hook for iOS/Android lock screen controls and background playback.
 * 
 * iOS Safari REQUIRES Media Session API for:
 * - Lock screen controls
 * - Control Center integration
 * - Background playback permission
 */
import { useEffect } from 'react'
import { useAudioStore } from '@/lib/audio-store'

export function useMediaSession() {
  const currentVersion = useAudioStore((state) => state.currentVersion)
  const isPlaying = useAudioStore((state) => state.isPlaying)
  const play = useAudioStore((state) => state.play)
  const pause = useAudioStore((state) => state.pause)
  const next = useAudioStore((state) => state.next)
  const previous = useAudioStore((state) => state.previous)
  const setCurrentTime = useAudioStore((state) => state.setCurrentTime)
  const currentTime = useAudioStore((state) => state.currentTime)
  const duration = useAudioStore((state) => state.duration)
  const queue = useAudioStore((state) => state.queue)

  // Update Media Session metadata when track changes
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    if (!currentVersion) {
      navigator.mediaSession.metadata = null
      return
    }

    // Extract extended metadata if available
    const extended = currentVersion as unknown as { 
      albumTitle?: string
      songTitle?: string 
      artistName?: string
    }
    
    const title = extended.songTitle || currentVersion.label || 'Unknown Track'
    const artist = extended.artistName || 'Loki Lazer'
    const album = extended.albumTitle || 'LokiTunes'

    // Build artwork array - use cover_url if available
    const artwork: MediaImage[] = []
    if (currentVersion.cover_url) {
      artwork.push(
        { src: currentVersion.cover_url, sizes: '96x96', type: 'image/jpeg' },
        { src: currentVersion.cover_url, sizes: '128x128', type: 'image/jpeg' },
        { src: currentVersion.cover_url, sizes: '192x192', type: 'image/jpeg' },
        { src: currentVersion.cover_url, sizes: '256x256', type: 'image/jpeg' },
        { src: currentVersion.cover_url, sizes: '384x384', type: 'image/jpeg' },
        { src: currentVersion.cover_url, sizes: '512x512', type: 'image/jpeg' },
      )
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album,
      artwork,
    })

    console.log('[MediaSession] Metadata set:', { title, artist, album })
  }, [currentVersion])

  // Update playback state
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
  }, [isPlaying])

  // Update position state for seek bar on lock screen
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    if (!currentVersion || !duration) return

    try {
      navigator.mediaSession.setPositionState({
        duration: duration || 0,
        playbackRate: 1,
        position: Math.min(currentTime, duration),
      })
    } catch (e) {
      // Some browsers don't support setPositionState
      console.debug('[MediaSession] setPositionState not supported:', e)
    }
  }, [currentTime, duration, currentVersion])

  // Register action handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) return

    const canSkip = queue.length > 1

    // Play handler
    const handlePlay = () => {
      console.log('[MediaSession] Play action')
      if (currentVersion) {
        play(currentVersion, currentVersion.song_id)
      }
    }

    // Pause handler
    const handlePause = () => {
      console.log('[MediaSession] Pause action')
      pause()
    }

    // Previous track handler
    const handlePreviousTrack = () => {
      console.log('[MediaSession] Previous track action')
      if (canSkip) {
        previous()
      }
    }

    // Next track handler
    const handleNextTrack = () => {
      console.log('[MediaSession] Next track action')
      if (canSkip) {
        next()
      }
    }

    // Seek backward handler (10 seconds)
    const handleSeekBackward = (details: MediaSessionActionDetails) => {
      const skipTime = details.seekOffset || 10
      const newTime = Math.max(currentTime - skipTime, 0)
      console.log('[MediaSession] Seek backward:', skipTime)
      setCurrentTime(newTime)
    }

    // Seek forward handler (10 seconds)
    const handleSeekForward = (details: MediaSessionActionDetails) => {
      const skipTime = details.seekOffset || 10
      const newTime = Math.min(currentTime + skipTime, duration || Infinity)
      console.log('[MediaSession] Seek forward:', skipTime)
      setCurrentTime(newTime)
    }

    // Seek to specific position
    const handleSeekTo = (details: MediaSessionActionDetails) => {
      if (details.seekTime !== undefined) {
        console.log('[MediaSession] Seek to:', details.seekTime)
        setCurrentTime(details.seekTime)
      }
    }

    // Stop handler
    const handleStop = () => {
      console.log('[MediaSession] Stop action')
      pause()
    }

    // Register all handlers
    try {
      navigator.mediaSession.setActionHandler('play', handlePlay)
      navigator.mediaSession.setActionHandler('pause', handlePause)
      navigator.mediaSession.setActionHandler('previoustrack', canSkip ? handlePreviousTrack : null)
      navigator.mediaSession.setActionHandler('nexttrack', canSkip ? handleNextTrack : null)
      navigator.mediaSession.setActionHandler('seekbackward', handleSeekBackward)
      navigator.mediaSession.setActionHandler('seekforward', handleSeekForward)
      navigator.mediaSession.setActionHandler('seekto', handleSeekTo)
      navigator.mediaSession.setActionHandler('stop', handleStop)
    } catch (e) {
      console.warn('[MediaSession] Error setting action handlers:', e)
    }

    return () => {
      // Clean up handlers
      try {
        navigator.mediaSession.setActionHandler('play', null)
        navigator.mediaSession.setActionHandler('pause', null)
        navigator.mediaSession.setActionHandler('previoustrack', null)
        navigator.mediaSession.setActionHandler('nexttrack', null)
        navigator.mediaSession.setActionHandler('seekbackward', null)
        navigator.mediaSession.setActionHandler('seekforward', null)
        navigator.mediaSession.setActionHandler('seekto', null)
        navigator.mediaSession.setActionHandler('stop', null)
      } catch {
        // Ignore cleanup errors
      }
    }
  }, [currentVersion, queue.length, currentTime, duration, play, pause, next, previous, setCurrentTime])

  return null
}
