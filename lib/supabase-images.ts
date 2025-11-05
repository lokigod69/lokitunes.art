/**
 * Helper functions for loading images from Supabase nested folder structure
 * Structure: covers/album-slug/cover.jpg
 *           covers/album-slug/01-song-name.jpg
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/covers`

/**
 * Get album cover URLs from nested folder (tries ALL possible patterns)
 * Handles: spaces, no spaces, different extensions, different naming conventions
 */
export function getAlbumCoverUrl(albumSlug: string): string[] {
  if (!SUPABASE_URL) return []
  
  // Clean slug: remove spaces and special chars (CamouflageGirl, not Camouflage Girl)
  const cleanSlug = albumSlug.replace(/\s+/g, '').replace(/[^a-zA-Z0-9-]/g, '')
  
  // Original slug with spaces
  const originalSlug = albumSlug
  
  // Try EVERY possible pattern
  return [
    // Pattern 1: Clean folder, album name as filename
    `${STORAGE_URL}/${cleanSlug}/${cleanSlug}.jpeg`,
    `${STORAGE_URL}/${cleanSlug}/${cleanSlug}.jpg`,
    `${STORAGE_URL}/${cleanSlug}/${cleanSlug}.png`,
    
    // Pattern 2: Clean folder, "cover" filename
    `${STORAGE_URL}/${cleanSlug}/cover.jpeg`,
    `${STORAGE_URL}/${cleanSlug}/cover.jpg`,
    `${STORAGE_URL}/${cleanSlug}/cover.png`,
    
    // Pattern 3: Original slug with spaces, album name
    `${STORAGE_URL}/${originalSlug}/${originalSlug}.jpeg`,
    `${STORAGE_URL}/${originalSlug}/${originalSlug}.jpg`,
    `${STORAGE_URL}/${originalSlug}/${originalSlug}.png`,
    
    // Pattern 4: Original slug with spaces, "cover" filename
    `${STORAGE_URL}/${originalSlug}/cover.jpeg`,
    `${STORAGE_URL}/${originalSlug}/cover.jpg`,
    `${STORAGE_URL}/${originalSlug}/cover.png`,
    
    // Pattern 5: At root level (no folder)
    `${STORAGE_URL}/${cleanSlug}.jpeg`,
    `${STORAGE_URL}/${cleanSlug}.jpg`,
    `${STORAGE_URL}/${cleanSlug}.png`,
    `${STORAGE_URL}/${originalSlug}.jpeg`,
    `${STORAGE_URL}/${originalSlug}.jpg`,
    `${STORAGE_URL}/${originalSlug}.png`,
  ]
}

/**
 * Get song/version cover URLs from nested folder (tries ALL possible patterns)
 * 
 * @param albumSlug - Album slug (e.g., "Burn" or "Camouflage Girl")
 * @param songFilename - Full filename with extension (e.g., "01-Burn-Tom Parker.wav")
 * @returns Array of possible URLs to try
 */
export function getSongCoverUrl(albumSlug: string, songFilename: string): string[] {
  if (!SUPABASE_URL || !songFilename) return []
  
  // Clean slug: no spaces
  const cleanSlug = albumSlug.replace(/\s+/g, '').replace(/[^a-zA-Z0-9-]/g, '')
  const originalSlug = albumSlug
  
  // Extract base name from audio filename
  // "01-Burn-Tom Parker.wav" -> "01-Burn-Tom Parker"
  const baseName = songFilename
    .replace(/\.(wav|mp3|flac|m4a|aac|ogg)$/i, '')
    .trim()
  
  return [
    // Try with clean slug folder
    `${STORAGE_URL}/${cleanSlug}/${baseName}.jpeg`,
    `${STORAGE_URL}/${cleanSlug}/${baseName}.jpg`,
    `${STORAGE_URL}/${cleanSlug}/${baseName}.png`,
    
    // Try with original slug folder (with spaces)
    `${STORAGE_URL}/${originalSlug}/${baseName}.jpeg`,
    `${STORAGE_URL}/${originalSlug}/${baseName}.jpg`,
    `${STORAGE_URL}/${originalSlug}/${baseName}.png`,
  ]
}

/**
 * Get song cover URL with multiple extension fallbacks including album cover
 */
export function getSongCoverUrlWithFallbacks(albumSlug: string, songFilename: string): string[] {
  if (!SUPABASE_URL || !songFilename) return []
  
  const songUrls = getSongCoverUrl(albumSlug, songFilename)
  const albumUrls = getAlbumCoverUrl(albumSlug)
  
  // Try song covers first, then fall back to album covers
  return [...songUrls, ...albumUrls]
}

/**
 * Preload an image to check if it exists
 */
export function preloadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

/**
 * Get first available image URL from a list of fallbacks
 */
export async function getFirstAvailableImage(urls: string[]): Promise<string | null> {
  for (const url of urls) {
    const exists = await preloadImage(url)
    if (exists) return url
  }
  return null
}
