import { create } from 'zustand'
import type { SongVersion } from './supabase'

interface AudioState {
  // Currently playing version
  currentVersion: SongVersion | null
  currentSongId: string | null
  
  // Playback state
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  
  // Actions
  play: (version: SongVersion, songId: string) => void
  pause: () => void
  stop: () => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  updateTime: (time: number) => void
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentVersion: null,
  currentSongId: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: typeof window !== 'undefined' 
    ? parseFloat(localStorage.getItem('lokitunes-volume') || '0.7')
    : 0.7,

  play: (version, songId) => {
    const current = get()
    
    // If switching to a different version, reset time
    if (current.currentVersion?.id !== version.id) {
      set({
        currentVersion: version,
        currentSongId: songId,
        isPlaying: true,
        currentTime: 0,
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
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  }),

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
