/**
 * Helper functions for loading images from Supabase nested folder structure
 * Structure: covers/album-slug/cover.jpg
 *           covers/album-slug/01-song-name.jpg
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

/**
 * Get album cover URLs from nested folder (tries multiple extensions)
 * Example: covers/Burn/cover.jpg, covers/Burn/cover.jpeg, etc.
 */
export function getAlbumCoverUrl(albumSlug: string): string[] {
  if (!supabaseUrl) return []
  
  const baseUrl = `${supabaseUrl}/storage/v1/object/public/covers/${albumSlug}`
  
  // Try multiple possible filenames in order of likelihood
  return [
    `${baseUrl}/cover.jpg`,
    `${baseUrl}/cover.jpeg`,
    `${baseUrl}/cover.png`,
    `${baseUrl}/${albumSlug}.jpg`,
    `${baseUrl}/${albumSlug}.jpeg`,
    `${baseUrl}/${albumSlug}.png`,
  ]
}

/**
 * Get song/version cover URLs from nested folder (tries multiple extensions)
 * Example: covers/Burn/01-Burn-Tom Parker.jpg, .jpeg, .png
 * 
 * @param albumSlug - Album slug (e.g., "Burn")
 * @param songFilename - Full filename with extension (e.g., "01-Burn-Tom Parker.wav")
 * @returns Array of possible URLs to try
 */
export function getSongCoverUrl(albumSlug: string, songFilename: string): string[] {
  if (!supabaseUrl || !songFilename) return []
  
  // Extract base name without extension
  const baseName = songFilename.replace(/\.(wav|mp3|flac|ogg|m4a)$/i, '')
  const baseUrl = `${supabaseUrl}/storage/v1/object/public/covers/${albumSlug}`
  
  return [
    `${baseUrl}/${baseName}.jpg`,
    `${baseUrl}/${baseName}.jpeg`,
    `${baseUrl}/${baseName}.png`,
  ]
}

/**
 * Get song cover URL with multiple extension fallbacks including album cover
 */
export function getSongCoverUrlWithFallbacks(albumSlug: string, songFilename: string): string[] {
  if (!supabaseUrl || !songFilename) return []
  
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
