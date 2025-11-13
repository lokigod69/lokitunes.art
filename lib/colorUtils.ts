/**
 * Color utility functions for dynamic theming
 */

/**
 * Calculate relative luminance of a hex color using ITU-R BT.709 coefficients
 * @param hexColor - Hex color string (with or without #)
 * @returns Luminance value between 0 (black) and 1 (white)
 */
export function getLuminance(hexColor: string): number {
  // Remove # if present
  const hex = hexColor.replace('#', '')
  const rgb = parseInt(hex, 16)
  
  const r = (rgb >> 16) & 0xff
  const g = (rgb >> 8) & 0xff
  const b = (rgb >> 0) & 0xff
  
  // Relative luminance formula (ITU-R BT.709)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/**
 * Get contrasting text color (black or white) for optimal readability
 * @param bgColor - Background color in hex format
 * @returns '#000000' for light backgrounds, '#ffffff' for dark backgrounds
 */
export function getContrastColor(bgColor: string): string {
  const luminance = getLuminance(bgColor)
  // Threshold: 0.5
  // Light backgrounds (>0.5) → Black text
  // Dark backgrounds (≤0.5) → White text
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

/**
 * Get inverted outline color (opposite of text color)
 * @param textColor - Text color ('#000000' or '#ffffff')
 * @returns Opposite color for outline
 */
export function getOutlineColor(textColor: string): string {
  return textColor === '#000000' ? '#ffffff' : '#000000'
}
