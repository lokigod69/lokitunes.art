/**
 * Calculate dynamic orb layout based on album count
 * Fewer albums = bigger orbs, more spread out
 */

export interface OrbLayout {
  positions: [number, number, number][]
  radius: number
  spacing: number
}

export function calculateOrbLayout(albumCount: number): OrbLayout {
  // Base radius calculation - fewer albums = bigger orbs
  const baseRadius = albumCount <= 5 ? 3.5 : 
                     albumCount <= 10 ? 2.5 : 
                     albumCount <= 15 ? 2.0 : 1.5
  
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
 * Calculate camera distance to fit all orbs in view
 */
export function calculateCameraDistance(albumCount: number): number {
  const { radius, spacing } = calculateOrbLayout(albumCount)
  const gridSize = Math.ceil(Math.sqrt(albumCount))
  const fieldSize = gridSize * spacing + radius * 2
  
  // FOV is 50 degrees, calculate distance to fit field
  const fov = 50
  const distance = (fieldSize / 2) / Math.tan((fov * Math.PI) / 360)
  
  // Add padding
  return Math.max(distance * 1.2, 20)
}
