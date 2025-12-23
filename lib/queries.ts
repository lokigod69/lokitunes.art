import { supabase, Album, AlbumWithSongs, Song, SongVersion } from './supabase'

/**
 * Clean palette colors by stripping alpha channel
 * THREE.js requires 6-char hex (#RRGGBB), not 8-char (#RRGGBBAA)
 */
function cleanPalette(palette: any): any {
  if (!palette || typeof palette !== 'object') return palette
  
  console.log('🎨 CLEANING PALETTE - BEFORE:', JSON.stringify(palette, null, 2))
  
  const cleaned: any = {}
  for (const key in palette) {
    const color = palette[key]
    // Strip alpha if color is a string with 8+ characters (#RRGGBBAA → #RRGGBB)
    cleaned[key] = (typeof color === 'string' && color.length > 7) 
      ? color.slice(0, 7) 
      : color
  }
  
  console.log('🎨 CLEANING PALETTE - AFTER:', JSON.stringify(cleaned, null, 2))
  
  return cleaned
}

/**
 * Fetch all public albums with version counts for orb sizing
 */
export async function getAlbumsWithVersionCounts(): Promise<Album[]> {
  const { data, error } = await supabase
    .from('albums')
    .select(`
      id,
      slug,
      title,
      cover_url,
      palette,
      is_public,
      created_at,
      songs (
        id,
        song_versions (
          id
        )
      )
    `)
    .eq('is_public', true)

  if (error) {
    console.error('Error fetching albums:', error)
    return []
  }

  // Calculate total versions per album
  const albums = (data || []).map((album: any) => {
    const total_versions = album.songs?.reduce((sum: number, song: any) => {
      return sum + (song.song_versions?.length || 0)
    }, 0) || 0

    return {
      id: album.id,
      slug: album.slug,
      title: album.title,
      cover_url: album.cover_url,
      palette: cleanPalette(album.palette), // ✅ Strip alpha from palette colors
      is_public: album.is_public,
      created_at: album.created_at,
      total_versions,
    }
  })

  // Custom sort: Mind Palace first, then alphabetical by title
  const priorityOrder = ['mind-palace'] // slugs that should appear first
  return albums.sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a.slug)
    const bIndex = priorityOrder.indexOf(b.slug)
    
    // If both are in priority list, sort by priority order
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    // Priority items come first
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    // Otherwise sort alphabetically by title
    return a.title.localeCompare(b.title)
  })
}

/**
 * Fetch a single album with all songs and versions
 */
export async function getAlbumBySlug(slug: string): Promise<AlbumWithSongs | null> {
  const { data: album, error: albumError } = await supabase
    .from('albums')
    .select('*')
    .eq('slug', slug)
    .eq('is_public', true)
    .single()

  if (albumError || !album) {
    console.error('Error fetching album:', albumError)
    return null
  }

  const { data: songs, error: songsError } = await supabase
    .from('songs')
    .select(`
      *,
      song_versions (*)
    `)
    .eq('album_id', album.id)
    .order('track_no', { ascending: true })

  if (songsError) {
    console.error('Error fetching songs:', songsError)
    return null
  }

  // Transform the data structure 
  const songsWithVersions = (songs || []).map((song: any) => ({
    id: song.id,
    album_id: song.album_id,
    title: song.title,
    track_no: song.track_no,
    created_at: song.created_at,
    versions: (song.song_versions || []).map((v: any) => {
      return {
        id: v.id,
        song_id: v.song_id,
        label: v.label,
        audio_url: v.audio_url,
        cover_url: v.cover_url,
        duration_sec: v.duration_sec,
        waveform_json: v.waveform_json,
        is_original: v.is_original,
        play_count: v.play_count,
        created_at: v.created_at,
      }
    }),
  }))

  return {
    ...album,
    palette: cleanPalette(album.palette), // ✅ Strip alpha from palette colors
    songs: songsWithVersions,
  }
}

/**
 * Increment play count for a version
 */
export async function incrementPlayCount(versionId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_play_count', {
    version_id: versionId,
  })

  if (error) {
    console.error('Error incrementing play count:', error)
  }
}
