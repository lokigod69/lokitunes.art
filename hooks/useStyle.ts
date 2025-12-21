/**
 * Persisted global style (color/chrome/monochrome) for LokiTunes.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type LokiTunesStyle = 'color' | 'monochrome' | 'invert'

function normalizeStyle(value: unknown): LokiTunesStyle {
  if (value === 'monochrome' || value === 'invert' || value === 'color') return value
  return 'color'
}

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
      version: 1,
      migrate: (persistedState) => {
        const style = (persistedState as { style?: unknown } | null)?.style
        return { style: normalizeStyle(style) } as unknown as StyleState
      },
    }
  )
)
