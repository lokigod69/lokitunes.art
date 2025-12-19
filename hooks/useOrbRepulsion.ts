/**
 * Orb Repulsion State Management
 * Zustand store for controlling orb-to-orb repulsion strength via slider
 */
import { create } from 'zustand'

interface OrbRepulsionState {
  repulsionStrength: number  // 0 = no repulsion, 1 = max repulsion (atoms-like spacing)
  setRepulsionStrength: (value: number) => void
}

export const useOrbRepulsion = create<OrbRepulsionState>((set) => ({
  repulsionStrength: 0,  // Default: no extra repulsion
  
  setRepulsionStrength: (value: number) => set({ 
    repulsionStrength: Math.max(0, Math.min(1, value)) 
  }),
}))
