import { create } from 'zustand'
import type { SongVersion, Album } from './supabase'

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
  
  // Actions
  play: (version: SongVersion, songId: string, palette?: Album['palette']) => void
  pause: () => void
  stop: () => void
  setQueue: (versions: SongVersion[], startIndex?: number) => void
  next: () => void
  previous: () => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  updateTime: (time: number) => void
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

  play: (version, songId, palette) => {
    const current = get()
    
    // If switching to a different version, reset time
    if (current.currentVersion?.id !== version.id) {
      set({
        currentVersion: version,
        currentSongId: songId,
        currentPalette: palette || null,
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
}))
