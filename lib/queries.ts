import { supabase, Album, AlbumWithSongs, Song, SongVersion } from './supabase'
import { getSongCoverUrl } from './supabase-images'

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
  return (data || []).map((album: any) => {
    const total_versions = album.songs?.reduce((sum: number, song: any) => {
      return sum + (song.song_versions?.length || 0)
    }, 0) || 0

    return {
      id: album.id,
      slug: album.slug,
      title: album.title,
      cover_url: album.cover_url,
      palette: album.palette,
      is_public: album.is_public,
      created_at: album.created_at,
      total_versions,
    }
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

  // Transform the data structure and generate cover URLs from nested folders
  const songsWithVersions = (songs || []).map((song: any) => ({
    id: song.id,
    album_id: song.album_id,
    title: song.title,
    track_no: song.track_no,
    created_at: song.created_at,
    versions: (song.song_versions || []).map((v: any) => {
      // Extract filename from audio_url to generate cover_url
      const audioFilename = v.audio_url?.split('/').pop() || ''
      const generatedCoverUrls = getSongCoverUrl(album.slug, audioFilename)
      
      return {
        id: v.id,
        song_id: v.song_id,
        label: v.label,
        audio_url: v.audio_url,
        cover_url: v.cover_url || generatedCoverUrls[0], // Use DB value or first generated URL
        duration_sec: v.duration_sec,
        waveform_json: v.waveform_json,
        play_count: v.play_count,
        created_at: v.created_at,
      }
    }),
  }))

  return {
    ...album,
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
