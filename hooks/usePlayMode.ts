/**
 * Play Mode State Management
 * Zustand store for the "Orb Defense" mini-game mode
 */
import { create } from 'zustand'

interface Burst {
  id: string
  position: [number, number, number]
  colors: string[]
}

interface PlayModeState {
  isActive: boolean
  isPaused: boolean
  orbsRemaining: number
  totalOrbs: number
  orbsLost: number[]  // Track which orb indices are lost
  obstacleSpeed: number
  bursts: Burst[]  // Active burst effects
  
  startGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  stopGame: () => void
  resetRun: () => void
  loseOrb: (orbIndex: number) => void
  setTotalOrbs: (count: number) => void
  triggerBurst: (position: [number, number, number], colors: string[]) => void
  removeBurst: (id: string) => void
}

export const usePlayMode = create<PlayModeState>((set, get) => ({
  isActive: false,
  isPaused: false,
  orbsRemaining: 0,
  totalOrbs: 0,
  orbsLost: [],
  obstacleSpeed: 0.5,
  bursts: [],
  
  startGame: () => set({ 
    isActive: true, 
    isPaused: false, 
    orbsRemaining: get().totalOrbs,
    orbsLost: [],
    bursts: []
  }),
  
  pauseGame: () => set({ isPaused: true }),
  
  resumeGame: () => set({ isPaused: false }),
  
  stopGame: () => set({ 
    isActive: false, 
    isPaused: false,
    orbsLost: [],
    bursts: []
  }),

  resetRun: () => set(state => ({
    isPaused: false,
    orbsRemaining: state.totalOrbs,
    orbsLost: [],
    bursts: [],
  })),
  
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
