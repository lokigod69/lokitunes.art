import { create } from 'zustand'
import type { SongVersion, Album } from './supabase'

type AutoplayMode = 'off' | 'album' | 'all'

function getInitialAutoplayMode(): AutoplayMode {
  if (typeof window === 'undefined') return 'album'
  try {
    const stored = window.localStorage?.getItem('lokitunes-autoplay-mode')
    if (stored === 'off' || stored === 'album' || stored === 'all') return stored
  } catch {
    // ignore storage errors and fall back to default
  }
  return 'album'
}

interface AudioState {
  // Currently playing version
  currentVersion: SongVersion | null
  currentSongId: string | null
  currentPalette: Album['palette'] | null
  
  // Queue management
  queue: SongVersion[]
  currentIndex: number
  
  // Playback state
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  autoplayMode: AutoplayMode
  
  // Actions
  play: (version: SongVersion, songId: string, palette?: Album['palette'], forceRestart?: boolean) => void
  pause: () => void
  stop: () => void
  setQueue: (versions: SongVersion[], startIndex?: number) => void
  startAlbumQueue: (versions: SongVersion[], startId: string, palette?: Album['palette']) => void
  next: () => void
  previous: () => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  updateTime: (time: number) => void
  setAutoplayMode: (mode: AutoplayMode) => void
  handleTrackEnd: () => void
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentVersion: null,
  currentSongId: null,
  currentPalette: null,
  queue: [],
  currentIndex: 0,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: typeof window !== 'undefined' 
    ? parseFloat(localStorage.getItem('lokitunes-volume') || '0.7')
    : 0.7,
  autoplayMode: getInitialAutoplayMode(),

  play: (version, songId, palette, forceRestart = false) => {
    const current = get()

    // If no palette is provided, preserve the existing one
    const resolvedPalette =
      palette !== undefined ? palette : current.currentPalette
    
    // If switching to a different version OR forceRestart is true, reset time
    if (current.currentVersion?.id !== version.id || forceRestart) {
      set({
        currentVersion: version,
        currentSongId: songId,
        currentPalette: resolvedPalette ?? null,
        isPlaying: true,
        currentTime: 0,
        queue: [version],
        currentIndex: 0,
      })
    } else {
      // Resume current version
      set({ isPlaying: true })
    }
  },

  pause: () => set({ isPlaying: false }),

  stop: () => set({
    currentVersion: null,
    currentSongId: null,
    currentPalette: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    queue: [],
    currentIndex: 0,
  }),

  setQueue: (versions, startIndex = 0) => set({
    queue: versions,
    currentVersion: versions[startIndex],
    currentIndex: startIndex,
    isPlaying: true,
    currentTime: 0,
  }),

  // Build a shuffled queue of versions within a single album, starting from the clicked one.
  startAlbumQueue: (versions, startId, palette) => {
    if (!versions || versions.length === 0) return

    const clickedIndex = versions.findIndex((v) => v.id === startId)

    // Fallback: if the clicked version is not found, just play the first version
    if (clickedIndex === -1) {
      const fallback = versions[0]
      const resolvedPalette =
        palette !== undefined ? palette : get().currentPalette

      set({
        currentVersion: fallback,
        currentSongId: (fallback as any).songId ?? (fallback as any).song_id ?? null,
        currentPalette: resolvedPalette ?? null,
        isPlaying: true,
        currentTime: 0,
        queue: [fallback],
        currentIndex: 0,
      })
      return
    }

    const clicked = versions[clickedIndex]
    const rest = versions.filter((v) => v.id !== startId)
    const shuffledRest = [...rest].sort(() => Math.random() - 0.5)
    const queue = [clicked, ...shuffledRest]

    const resolvedPalette =
      palette !== undefined ? palette : get().currentPalette

    set({
      queue,
      currentVersion: clicked,
      currentSongId: (clicked as any).songId ?? (clicked as any).song_id ?? null,
      currentPalette: resolvedPalette ?? null,
      currentIndex: 0,
      isPlaying: true,
      currentTime: 0,
    })
  },

  next: () => {
    const { queue, currentIndex } = get()
    if (queue.length === 0) return
    
    const nextIndex = (currentIndex + 1) % queue.length
    set({
      currentIndex: nextIndex,
      currentVersion: queue[nextIndex],
      isPlaying: true,
      currentTime: 0,
    })
  },

  previous: () => {
    const { queue, currentIndex } = get()
    if (queue.length === 0) return
    
    const prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1
    set({
      currentIndex: prevIndex,
      currentVersion: queue[prevIndex],
      isPlaying: true,
      currentTime: 0,
    })
  },

  setCurrentTime: (time) => set({ currentTime: time }),

  setDuration: (duration) => set({ duration }),

  setVolume: (volume) => {
    set({ volume })
    if (typeof window !== 'undefined') {
      localStorage.setItem('lokitunes-volume', volume.toString())
    }
  },

  updateTime: (time) => set({ currentTime: time }),

   setAutoplayMode: (mode) => {
    set({ autoplayMode: mode })
    if (typeof window !== 'undefined') {
      try {
        window.localStorage?.setItem('lokitunes-autoplay-mode', mode)
      } catch {
        // ignore storage errors
      }
    }
  },

  // Called by AudioEngine when a track finishes playback.
  // Respects autoplayMode: when 'off', simply stops; otherwise advances in the queue.
  handleTrackEnd: () => {
    const { autoplayMode, queue } = get()

    if (queue.length === 0) {
      set({ isPlaying: false })
      return
    }

    if (autoplayMode === 'off') {
      set({ isPlaying: false })
      return
    }

    // For 'album' and 'all' we just advance in the current queue.
    get().next()
  },
}))
