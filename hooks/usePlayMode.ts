/**
 * Play Mode State Management
 * Zustand store for the "Orb Defense" mini-game mode
 */
import { create } from 'zustand'
import { safeLocalStorage } from '@/lib/safeLocalStorage'

const BEST_SCORE_KEY = 'lokitunes-playmode-best-score'
const RUN_DURATION_MS = 60_000

function loadBestScore(): number {
  const raw = safeLocalStorage.getItem(BEST_SCORE_KEY)
  if (!raw) return 0
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : 0
}

function persistBestScore(score: number): void {
  safeLocalStorage.setItem(BEST_SCORE_KEY, String(score))
}

interface Burst {
  id: string
  position: [number, number, number]
  colors: string[]
}

interface PlayModeState {
  isActive: boolean
  isPaused: boolean
  pauseStartedAt: number | null
  orbsRemaining: number
  totalOrbs: number
  orbsLost: number[]  // Track which orb indices are lost
  obstacleSpeed: number
  bursts: Burst[]  // Active burst effects

  score: number
  lastScore: number | null
  bestScore: number
  runEndsAt: number | null
  
  startGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  stopGame: () => void
  resetRun: () => void
  incrementScore: () => void
  finishRun: () => void
  loseOrb: (orbIndex: number) => void
  setTotalOrbs: (count: number) => void
  triggerBurst: (position: [number, number, number], colors: string[]) => void
  removeBurst: (id: string) => void
}

export const usePlayMode = create<PlayModeState>((set, get) => ({
  isActive: false,
  isPaused: false,
  pauseStartedAt: null,
  orbsRemaining: 0,
  totalOrbs: 0,
  orbsLost: [],
  obstacleSpeed: 0.5,
  bursts: [],

  score: 0,
  lastScore: null,
  bestScore: loadBestScore(),
  runEndsAt: null,
  
  startGame: () => set({ 
    isActive: true, 
    isPaused: false, 
    pauseStartedAt: null,
    orbsRemaining: get().totalOrbs,
    orbsLost: [],
    bursts: [],
    score: 0,
    runEndsAt: Date.now() + RUN_DURATION_MS,
  }),
  
  pauseGame: () => set((state) => {
    if (state.isPaused) return state
    return { isPaused: true, pauseStartedAt: Date.now() }
  }),
  
  resumeGame: () => set((state) => {
    if (!state.isPaused) return state
    if (!state.pauseStartedAt || !state.runEndsAt) {
      return { isPaused: false, pauseStartedAt: null }
    }

    const pausedFor = Date.now() - state.pauseStartedAt
    return {
      isPaused: false,
      pauseStartedAt: null,
      runEndsAt: state.runEndsAt + pausedFor,
    }
  }),
  
  stopGame: () => set({ 
    isActive: false, 
    isPaused: false,
    pauseStartedAt: null,
    runEndsAt: null,
    orbsLost: [],
    bursts: [],
    score: 0,
  }),

  resetRun: () => set(state => ({
    isPaused: false,
    pauseStartedAt: null,
    orbsRemaining: state.totalOrbs,
    orbsLost: [],
    bursts: [],
  })),

  incrementScore: () => set(state => ({ score: state.score + 1 })),

  finishRun: () => set(state => {
    const finalScore = state.score
    const nextBest = Math.max(state.bestScore, finalScore)
    if (nextBest !== state.bestScore) {
      persistBestScore(nextBest)
    }

    return {
      isActive: false,
      isPaused: false,
      pauseStartedAt: null,
      runEndsAt: null,
      score: 0,
      lastScore: finalScore,
      bestScore: nextBest,
      orbsLost: [],
      bursts: [],
    }
  }),
  
  loseOrb: (orbIndex: number) => set(state => {
    if (state.orbsLost.includes(orbIndex)) return state
    return {
      orbsRemaining: Math.max(0, state.orbsRemaining - 1),
      orbsLost: [...state.orbsLost, orbIndex]
    }
  }),
  
  setTotalOrbs: (count) => set({ totalOrbs: count, orbsRemaining: count }),
  
  triggerBurst: (position, colors) => {
    const id = `burst-${Date.now()}-${Math.random().toString(36).slice(2)}`
    set(state => ({ 
      bursts: [...state.bursts, { id, position, colors }] 
    }))
  },
  
  removeBurst: (id) => {
    set(state => ({ 
      bursts: state.bursts.filter(b => b.id !== id) 
    }))
  },
}))
