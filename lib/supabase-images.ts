/**
 * Helper functions for loading images from Supabase nested folder structure
 * Structure: covers/album-slug/cover.jpg
 *           covers/album-slug/01-song-name.jpg
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

/**
 * Get album cover URL from nested folder
 * Example: covers/Burn/cover.jpg
 */
export function getAlbumCoverUrl(albumSlug: string): string {
  if (!supabaseUrl) return ''
  return `${supabaseUrl}/storage/v1/object/public/covers/${albumSlug}/cover.jpg`
}

/**
 * Get song/version cover URL from nested folder
 * Example: covers/Burn/01-Burn-Tom Parker.jpg
 * 
 * @param albumSlug - Album slug (e.g., "Burn")
 * @param songFilename - Full filename with extension (e.g., "01-Burn-Tom Parker.wav")
 * @returns URL to the song cover image
 */
export function getSongCoverUrl(albumSlug: string, songFilename: string): string {
  if (!supabaseUrl || !songFilename) return ''
  
  // Extract base name without extension
  const baseName = songFilename.replace(/\.(wav|mp3|flac|ogg|m4a)$/i, '')
  
  // Try common image extensions
  return `${supabaseUrl}/storage/v1/object/public/covers/${albumSlug}/${baseName}.jpg`
}

/**
 * Get song cover URL with multiple extension fallbacks
 */
export function getSongCoverUrlWithFallbacks(albumSlug: string, songFilename: string): string[] {
  if (!supabaseUrl || !songFilename) return []
  
  const baseName = songFilename.replace(/\.(wav|mp3|flac|ogg|m4a)$/i, '')
  
  return [
    `${supabaseUrl}/storage/v1/object/public/covers/${albumSlug}/${baseName}.jpg`,
    `${supabaseUrl}/storage/v1/object/public/covers/${albumSlug}/${baseName}.jpeg`,
    `${supabaseUrl}/storage/v1/object/public/covers/${albumSlug}/${baseName}.png`,
    getAlbumCoverUrl(albumSlug) // Fallback to album cover
  ]
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
