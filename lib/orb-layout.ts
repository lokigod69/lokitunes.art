/**
 * Calculate dynamic orb layout based on album count
 * Fewer albums = bigger orbs, more spread out
 */

export interface OrbLayout {
  positions: [number, number, number][]
  radius: number
  spacing: number
}

export function calculateOrbLayout(albumCount: number, isMobile: boolean = false): OrbLayout {
  // Base radius calculation - fewer albums = bigger orbs
  let baseRadius = albumCount <= 5 ? 3.5 : 
                   albumCount <= 10 ? 2.5 : 
                   albumCount <= 15 ? 2.0 : 1.5
  
  // Scale down for mobile - 75% of desktop size (was 60%, too small for touch)
  if (isMobile) {
    baseRadius *= 0.75
  }
  
  // Spread them out in a nice grid pattern
  const gridSize = Math.ceil(Math.sqrt(albumCount))
  const spacing = baseRadius * 2.5
  
  const positions: [number, number, number][] = []
  let index = 0
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (index >= albumCount) break
      
      positions.push([
        (x - gridSize / 2 + 0.5) * spacing,
        (gridSize / 2 - y - 0.5) * spacing,
        0
      ])
      index++
    }
  }
  
  return { positions, radius: baseRadius, spacing }
}

/**
 * Calculate visual scale based on version count
 * Maps 1-5 versions to 0.6-1.0 scale (capped at 5)
 * Albums with 5+ versions get full size, fewer versions = smaller orb
 */
export function calculateOrbScale(versionCount: number): number {
  const clamped = Math.min(Math.max(versionCount, 1), 5) // Clamp 1-5
  return 0.6 + (clamped - 1) * 0.1  // 1→0.6, 2→0.7, 3→0.8, 4→0.9, 5→1.0
}

/**
 * Calculate camera distance to fit all orbs in view
 */
export function calculateCameraDistance(
  albumCount: number,
  isMobile: boolean = false,
  aspectRatio: number = 16/9
): number {
  const { radius, spacing } = calculateOrbLayout(albumCount, isMobile)
  const gridSize = Math.ceil(Math.sqrt(albumCount))
  const fieldSize = gridSize * spacing + radius * 2
  
  // FOV is 50 degrees, calculate distance to fit field
  const fov = 50
  let distance = (fieldSize / 2) / Math.tan((fov * Math.PI) / 360)
  
  // On portrait (aspectRatio < 1), pull back further to fit content in narrower horizontal view
  if (aspectRatio < 1) {
    distance = distance / aspectRatio
  }
  
  // Mobile needs extra padding due to UI elements and smaller orbs needing more context
  const padding = isMobile ? 1.4 : 1.2
  
  return Math.max(distance * padding, isMobile ? 15 : 20)
}
