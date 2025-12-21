import { create } from 'zustand'
import type { SongVersion, Album } from './supabase'

type AutoplayMode = 'off' | 'album' | 'all'

type SongVersionWithMeta = SongVersion & {
  songId?: string
  song_id?: string
  albumPalette?: Album['palette'] | null
  songTitle?: string
  albumTitle?: string
  albumSlug?: string
  trackNo?: number | null
}

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
  queue: SongVersionWithMeta[]
  currentIndex: number
  
  // Playback state
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  preMuteVolume: number
  autoplayMode: AutoplayMode
  
  // Actions
  play: (version: SongVersionWithMeta, songId: string, palette?: Album['palette'], forceRestart?: boolean) => void
  playStandalone: (version: SongVersionWithMeta, songId: string, palette?: Album['palette']) => void
  pause: () => void
  stop: () => void
  setQueue: (versions: SongVersionWithMeta[], startIndex?: number) => void
  startAlbumQueue: (versions: SongVersionWithMeta[], startId: string, palette?: Album['palette']) => void
  startGlobalQueue: (startVersion: SongVersionWithMeta, palette?: Album['palette']) => Promise<void>
  next: () => void
  previous: () => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
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
  isMuted: typeof window !== 'undefined'
    ? localStorage.getItem('lokitunes-muted') === 'true'
    : false,
  preMuteVolume: typeof window !== 'undefined'
    ? parseFloat(localStorage.getItem('lokitunes-pre-mute-volume') || '0.7')
    : 0.7,
  autoplayMode: getInitialAutoplayMode(),

  play: (version, songId, palette, forceRestart = false) => {
    const state = get()

    // If no palette is provided, preserve the existing one
    const resolvedPalette =
      palette !== undefined ? palette : state.currentPalette

    // Simple resume: same version, no restart → just set playing
    if (!forceRestart && state.currentVersion?.id === version.id) {
      // If we somehow ended up with an empty queue for a normal play session,
      // restore a single-track queue so end-of-track behavior stays consistent.
      if (state.queue.length === 0) {
        set({
          isPlaying: true,
          queue: [version],
          currentIndex: 0,
        })
      } else {
        set({ isPlaying: true })
      }
      return
    }

    // If this version already exists in the current queue, keep the queue
    // and just move the playhead to that index.
    const existingIndex = state.queue.findIndex((v) => v.id === version.id)

    if (existingIndex !== -1) {
      set({
        currentVersion: version,
        currentSongId: songId,
        currentPalette: resolvedPalette ?? null,
        isPlaying: true,
        currentTime: 0,
        currentIndex: existingIndex,
      })
      return
    }

    // Otherwise, start a new single-track session with its own queue.
    set({
      currentVersion: version,
      currentSongId: songId,
      currentPalette: resolvedPalette ?? null,
      isPlaying: true,
      currentTime: 0,
      queue: [version],
      currentIndex: 0,
    })
  },

  playStandalone: (version, songId, palette) => {
    const state = get()

    if (state.currentVersion?.id === version.id) {
      // Always keep standalone playback queue-less, even on resume.
      set({ isPlaying: true, queue: [], currentIndex: 0 })
      return
    }

    const resolvedPalette =
      palette !== undefined ? palette : state.currentPalette

    set({
      currentVersion: version,
      currentSongId: songId,
      currentPalette: resolvedPalette ?? null,
      isPlaying: true,
      currentTime: 0,
      queue: [],
      currentIndex: 0,
    })
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
    // Note: For 'all' mode, use startGlobalQueue instead
    if (!versions || versions.length === 0) return

    const clickedIndex = versions.findIndex((v) => v.id === startId)

    // Fallback: if the clicked version is not found, just play the first version
    if (clickedIndex === -1) {
      const fallback = versions[0]
      const resolvedPalette =
        palette !== undefined ? palette : get().currentPalette

      set({
        currentVersion: fallback,
        currentSongId: fallback.songId ?? fallback.song_id ?? null,
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
      currentSongId: clicked.songId ?? clicked.song_id ?? null,
      currentPalette: resolvedPalette ?? null,
      currentIndex: 0,
      isPlaying: true,
      currentTime: 0,
    })
  },

  // Fetch all versions from API and build a global shuffled queue (for 'all' mode)
  startGlobalQueue: async (startVersion, palette) => {
    try {
      const res = await fetch('/api/versions')
      if (!res.ok) throw new Error('Failed to fetch versions')
      const data = (await res.json()) as { versions?: SongVersionWithMeta[] }
      const allVersions: SongVersionWithMeta[] = data.versions ?? []
      
      if (allVersions.length === 0) {
        // Fallback to single track
        const resolvedPalette = palette !== undefined ? palette : get().currentPalette
        set({
          currentVersion: startVersion,
          currentSongId: startVersion.songId ?? startVersion.song_id ?? null,
          currentPalette: resolvedPalette ?? null,
          isPlaying: true,
          currentTime: 0,
          queue: [startVersion],
          currentIndex: 0,
        })
        return
      }
      
      // Build queue: clicked version first, then shuffle the rest
      const rest = allVersions.filter((v) => v.id !== startVersion.id)
      const shuffledRest = [...rest].sort(() => Math.random() - 0.5)
      const queue = [startVersion, ...shuffledRest]
      
      const resolvedPalette = palette !== undefined ? palette : get().currentPalette
      
      set({
        queue,
        currentVersion: startVersion,
        currentSongId: startVersion.songId ?? startVersion.song_id ?? null,
        currentPalette: resolvedPalette ?? null,
        currentIndex: 0,
        isPlaying: true,
        currentTime: 0,
      })
      
      console.log(`🌍 Global queue built: ${queue.length} tracks from all albums`)
    } catch (error) {
      console.error('Failed to build global queue:', error)
      // Fallback to single track playback
      const resolvedPalette = palette !== undefined ? palette : get().currentPalette
      set({
        currentVersion: startVersion,
        currentSongId: startVersion.songId ?? startVersion.song_id ?? null,
        currentPalette: resolvedPalette ?? null,
        isPlaying: true,
        currentTime: 0,
        queue: [startVersion],
        currentIndex: 0,
      })
    }
  },

  next: () => {
    const { queue, currentIndex, autoplayMode, currentVersion } = get()
    if (!currentVersion) return

    // In 'all' mode, ensure we have a global queue (so Next works immediately even
    // if playback was started from a single-track context).
    if (autoplayMode === 'all' && queue.length <= 1) {
      const current = currentVersion as SongVersionWithMeta

      fetch('/api/versions')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch versions')
          return res.json()
        })
        .then((data: { versions?: SongVersionWithMeta[] }) => {
          const allVersions = data.versions ?? []
          if (allVersions.length === 0) return

          const rest = allVersions.filter((v) => v.id !== current.id)
          const shuffledRest = [...rest].sort(() => Math.random() - 0.5)
          const nextQueue = [current, ...shuffledRest]

          set({ queue: nextQueue, currentIndex: 0 })

          // Immediately advance to the first shuffled item.
          const candidate = nextQueue[1]
          if (!candidate) return

          const nextPalette = candidate.albumPalette || get().currentPalette
          set({
            currentIndex: 1,
            currentVersion: candidate,
            currentSongId: candidate.songId ?? candidate.song_id ?? null,
            currentPalette: nextPalette ?? null,
            isPlaying: true,
            currentTime: 0,
          })
        })
        .catch((error) => {
          console.error('Failed to fetch versions for all-mode next():', error)
        })
      return
    }

    if (queue.length === 0) return

    let nextIndex = currentIndex + 1
    if (nextIndex >= queue.length) {
      if (autoplayMode === 'all') {
        nextIndex = 0
      } else {
        return
      }
    }

    const nextVersion = queue[nextIndex]
    if (!nextVersion) return

    const nextPalette = nextVersion.albumPalette || get().currentPalette

    set({
      currentIndex: nextIndex,
      currentVersion: nextVersion,
      currentSongId: nextVersion.songId ?? nextVersion.song_id ?? null,
      currentPalette: nextPalette ?? null,
      isPlaying: true,
      currentTime: 0,
    })
  },

  previous: () => {
    const { queue, currentIndex, autoplayMode } = get()
    if (queue.length === 0) return

    let prevIndex = currentIndex - 1
    if (prevIndex < 0) {
      if (autoplayMode === 'all') {
        prevIndex = queue.length - 1
      } else {
        return
      }
    }

    const prevVersion = queue[prevIndex]
    if (!prevVersion) return

    const prevPalette = prevVersion.albumPalette || get().currentPalette

    set({
      currentIndex: prevIndex,
      currentVersion: prevVersion,
      currentSongId: prevVersion.songId ?? prevVersion.song_id ?? null,
      currentPalette: prevPalette ?? null,
      isPlaying: true,
      currentTime: 0,
    })
  },

  setCurrentTime: (time) => set({ currentTime: time }),

  setDuration: (duration) => set({ duration }),

  setVolume: (volume) => {
    // If setting volume above 0 while muted, unmute
    if (volume > 0 && get().isMuted) {
      set({ volume, isMuted: false })
      if (typeof window !== 'undefined') {
        localStorage.setItem('lokitunes-volume', volume.toString())
        localStorage.setItem('lokitunes-muted', 'false')
      }
    } else {
      set({ volume })
      if (typeof window !== 'undefined') {
        localStorage.setItem('lokitunes-volume', volume.toString())
      }
    }
  },

  toggleMute: () => {
    const { isMuted, volume, preMuteVolume } = get()
    if (isMuted) {
      // Unmute: restore previous volume
      set({ isMuted: false, volume: preMuteVolume })
      if (typeof window !== 'undefined') {
        localStorage.setItem('lokitunes-muted', 'false')
        localStorage.setItem('lokitunes-volume', preMuteVolume.toString())
      }
    } else {
      // Mute: save current volume and set to 0
      set({ isMuted: true, preMuteVolume: volume, volume: 0 })
      if (typeof window !== 'undefined') {
        localStorage.setItem('lokitunes-muted', 'true')
        localStorage.setItem('lokitunes-pre-mute-volume', volume.toString())
        localStorage.setItem('lokitunes-volume', '0')
      }
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

    // If switching into 'all' mode while a track is already selected, eagerly
    // populate a global queue without restarting the current track.
    if (mode === 'all') {
      const current = get().currentVersion as SongVersionWithMeta | null
      if (!current) return

      fetch('/api/versions')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch versions')
          return res.json()
        })
        .then((data: { versions?: SongVersionWithMeta[] }) => {
          const allVersions = data.versions ?? []
          if (allVersions.length === 0) return

          const rest = allVersions.filter((v) => v.id !== current.id)
          const shuffledRest = [...rest].sort(() => Math.random() - 0.5)
          const nextQueue = [current, ...shuffledRest]
          set({ queue: nextQueue, currentIndex: 0 })
        })
        .catch((error) => {
          console.error('Failed to prebuild global queue for all-mode:', error)
        })
    }
  },

  // Called by AudioEngine when a track finishes playback.
  // Respects autoplayMode: when 'off', simply stops; otherwise advances in the queue.
  handleTrackEnd: () => {
    const { autoplayMode, queue, currentIndex } = get()

    if (queue.length === 0) {
      set({ isPlaying: false })
      return
    }

    if (autoplayMode === 'off') {
      set({ isPlaying: false })
      return
    }

    if (autoplayMode === 'album' && currentIndex >= queue.length - 1) {
      set({ isPlaying: false })
      return
    }

    get().next()
  },
}))
