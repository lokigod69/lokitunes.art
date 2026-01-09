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
import { devLog, devWarn } from '@/lib/debug'

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
  const autoplayMode = useAudioStore((state) => state.autoplayMode)

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

    const isOriginal = !!(currentVersion as unknown as { is_original?: boolean }).is_original
    const title = extended.songTitle || currentVersion.label || 'Unknown Track'
    const artist = !isOriginal && currentVersion.label ? currentVersion.label : (extended.artistName || 'Loki Lazer')
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

    devLog('[MediaSession] Metadata set:', { title, artist, album })
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
      devLog('[MediaSession] setPositionState not supported:', e)
    }
  }, [currentTime, duration, currentVersion])

  // Register action handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) return

    // Allow skip controls when:
    // - we already have a multi-item queue, OR
    // - we're in global autoplay mode ('all') where next() can build a global queue on demand.
    const canSkip = queue.length > 1 || autoplayMode === 'all'

    // Play handler
    const handlePlay = () => {
      devLog('[MediaSession] Play action')
      if (currentVersion) {
        const songId = (currentVersion as unknown as { songId?: string; song_id?: string }).songId
          ?? (currentVersion as unknown as { songId?: string; song_id?: string }).song_id
          ?? ''
        play(currentVersion, songId)
      }
    }

    // Pause handler
    const handlePause = () => {
      devLog('[MediaSession] Pause action')
      pause()
    }

    // Previous track handler
    const handlePreviousTrack = () => {
      devLog('[MediaSession] Previous track action')
      if (canSkip) {
        previous()
      }
    }

    // Next track handler
    const handleNextTrack = () => {
      devLog('[MediaSession] Next track action')
      if (canSkip) {
        next()
      }
    }

    // Seek to specific position
    const handleSeekTo = (details: MediaSessionActionDetails) => {
      if (details.seekTime !== undefined) {
        devLog('[MediaSession] Seek to:', details.seekTime)
        setCurrentTime(details.seekTime)
      }
    }

    // Stop handler
    const handleStop = () => {
      devLog('[MediaSession] Stop action')
      pause()
    }

    // Register all handlers
    try {
      navigator.mediaSession.setActionHandler('play', handlePlay)
      navigator.mediaSession.setActionHandler('pause', handlePause)
      navigator.mediaSession.setActionHandler('previoustrack', canSkip ? handlePreviousTrack : null)
      navigator.mediaSession.setActionHandler('nexttrack', canSkip ? handleNextTrack : null)
      // Prefer next/previous track buttons on lock screen (avoid +/- 10s UI).
      navigator.mediaSession.setActionHandler('seekbackward', null)
      navigator.mediaSession.setActionHandler('seekforward', null)
      navigator.mediaSession.setActionHandler('seekto', handleSeekTo)
      navigator.mediaSession.setActionHandler('stop', handleStop)
    } catch (e) {
      devWarn('[MediaSession] Error setting action handlers:', e)
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
  }, [currentVersion, queue.length, autoplayMode, play, pause, next, previous, setCurrentTime])

  return null
}
