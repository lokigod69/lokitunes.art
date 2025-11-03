import { Vibrant } from 'node-vibrant/node'

/**
 * Extract a 3-color palette from an image URL
 * Returns dominant, accent1, and accent2 colors
 */
export async function extractPalette(imageUrl: string): Promise<{
  dominant: string
  accent1: string
  accent2: string
} | null> {
  try {
    const palette = await Vibrant.from(imageUrl).getPalette()
    
    return {
      dominant: palette.DarkMuted?.hex || palette.Muted?.hex || '#090B0D',
      accent1: palette.Vibrant?.hex || palette.LightVibrant?.hex || '#4F9EFF',
      accent2: palette.DarkVibrant?.hex || palette.LightMuted?.hex || '#FF6B4A',
    }
  } catch (error) {
    console.error('Error extracting palette:', error)
    return null
  }
}

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Apply opacity to a hex color
 */
export function hexWithOpacity(hex: string, opacity: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`
}
