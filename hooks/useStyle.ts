/**
 * Persisted global style (color/chrome/monochrome) for LokiTunes.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type LokiTunesStyle = 'color' | 'chrome' | 'monochrome'

interface StyleState {
  style: LokiTunesStyle
  setStyle: (style: LokiTunesStyle) => void
}

export const useStyleStore = create<StyleState>()(
  persist(
    (set) => ({
      style: 'color',
      setStyle: (style) => set({ style }),
    }),
    {
      name: 'lokitunes-style',
    }
  )
)
