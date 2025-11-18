#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { Vibrant } from 'node-vibrant/node'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Parse command line flags
const args = process.argv.slice(2)
const forceMode = args.includes('--force')
const contentDirArg = args.find(arg => !arg.startsWith('--'))

interface AlbumData {
  slug: string
  title: string
  coverPath: string
  coverUrl?: string
  palette?: any
  songs: Map<number, SongData>
}

interface SongData {
  trackNo: number
  title: string
  versions: VersionData[]
}

interface VersionData {
  label: string
  filePath: string
  coverPath?: string
  audioUrl?: string
  coverUrl?: string
}

interface DbAlbum {
  id: string
  slug: string
  title: string
  cover_url: string
  palette: any
}

interface DbSong {
  id: string
  album_id: string
  title: string
  track_no: number
}

interface DbVersion {
  id: string
  song_id: string
  label: string
  audio_url: string
}

interface SyncChanges {
  albumsToAdd: AlbumData[]
  albumsToDelete: DbAlbum[]
  songsToAdd: { album: DbAlbum; song: SongData }[]
  songsToDelete: { album: DbAlbum; song: DbSong }[]
  songsToUpdate: { album: DbAlbum; oldSong: DbSong; newSong: SongData }[]
  versionsToAdd: { song: DbSong; version: VersionData }[]
  versionsToDelete: { song: DbSong; version: DbVersion }[]
  versionsToUpdate: { song: DbSong; oldVersion: DbVersion; newVersion: VersionData }[]
}

function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close()
      resolve(answer.trim().toLowerCase())
    })
  })
}

function prettifyName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function prettifyVersion(version: string): string {
  // Handle common patterns
  if (version === 'original') return 'Original'
  if (version.match(/^remix\d+$/)) {
    const num = version.replace('remix', '')
    return `Remix ${num}`
  }
  if (version === 'stripped') return 'Stripped'
  if (version === 'extended') return 'Extended'
  if (version === 'acoustic') return 'Acoustic'
  if (version === 'instrumental') return 'Instrumental'
  
  // Default: capitalize first letter of each word
  return version
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// NOTE: Backend supports multiple songs per album via track numbers, but the current
// frontend UX treats each album as a single song concept and only surfaces total
// version counts. These numeric prefixes (01-, 02-, etc.) are for organization and
// are not shown directly to users.
function parseAudioFilename(filename: string): { trackNo: number; title: string; version: string } | null {
  const nameWithoutExt = path.basename(filename, path.extname(filename))
  
  // Pattern 1: 01-songname-version.wav
  const match1 = nameWithoutExt.match(/^(\d+)-(.+?)-(.+)$/)
  if (match1) {
    return {
      trackNo: parseInt(match1[1]),
      title: prettifyName(match1[2]),
      version: prettifyVersion(match1[3]),
    }
  }
  
  // Pattern 2: 01-songname.wav (no version)
  const match2 = nameWithoutExt.match(/^(\d+)-(.+)$/)
  if (match2) {
    return {
      trackNo: parseInt(match2[1]),
      title: prettifyName(match2[2]),
      version: 'Original',
    }
  }
  
  // Pattern 3: songname-version.wav (no track number)
  const match3 = nameWithoutExt.match(/^(.+?)-(.+)$/)
  if (match3 && !match3[1].match(/^\d+$/)) {
    return {
      trackNo: 1,
      title: prettifyName(match3[1]),
      version: prettifyVersion(match3[2]),
    }
  }
  
  // Pattern 4: songname.wav (no track number, no version)
  return {
    trackNo: 1,
    title: prettifyName(nameWithoutExt),
    version: 'Original',
  }
}

function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase()
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)
}

function isAudioFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase()
  return ['.wav', '.mp3', '.ogg', '.flac'].includes(ext)
}

function getContentType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  const types: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac',
  }
  return types[ext] || 'application/octet-stream'
}

async function uploadFile(bucket: string, filePath: string, fileName: string): Promise<string | null> {
  try {
    const fileBuffer = fs.readFileSync(filePath)
    
    // Check if file already exists
    // For files in folders (e.g., "Platypus/cover.jpg"), we need to check the folder
    const folderPath = fileName.includes('/') ? fileName.substring(0, fileName.lastIndexOf('/')) : ''
    const { data: existingFiles } = await supabase.storage
      .from(bucket)
      .list(folderPath, { search: path.basename(fileName) })
    
    if (existingFiles && existingFiles.length > 0) {
      // File exists, return its public URL with full path
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
      return data.publicUrl
    }

    // Upload new file with full path (including folder)
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: getContentType(fileName),
        upsert: false,
      })

    if (error) {
      console.error(`      ❌ Failed to upload ${fileName}:`, error.message)
      return null
    }

    // Return public URL with full path (data.path includes the folder)
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
    return urlData.publicUrl
  } catch (error) {
    console.error(`      ❌ Error uploading ${fileName}:`, error)
    return null
  }
}

async function extractPalette(imageUrl: string): Promise<any> {
  try {
    const palette = await Vibrant.from(imageUrl).getPalette()
    
    return {
      dominant: palette.DarkMuted?.hex || palette.Muted?.hex || '#090B0D',
      accent1: palette.Vibrant?.hex || palette.LightVibrant?.hex || '#4F9EFF',
      accent2: palette.DarkVibrant?.hex || palette.LightMuted?.hex || '#FF6B4A',
    }
  } catch (error) {
    return {
      dominant: '#090B0D',
      accent1: '#4F9EFF',
      accent2: '#FF6B4A',
    }
  }
}

function scanAlbumFolder(albumPath: string, slug: string): AlbumData | null {
  const files = fs.readdirSync(albumPath)
  
  // Find cover image
  const coverFile = files.find(f => {
    const name = f.toLowerCase()
    return name.startsWith('cover.') && isImageFile(f)
  })
  
  if (!coverFile) {
    return null
  }
  
  // Find audio files
  const audioFiles = files.filter(isAudioFile)
  
  if (audioFiles.length === 0) {
    return null
  }
  
  // Parse audio files and group by track
  const songs = new Map<number, SongData>()
  
  for (const audioFile of audioFiles) {
    const parsed = parseAudioFilename(audioFile)
    if (!parsed) continue
    
    const { trackNo, title, version } = parsed
    
    if (!songs.has(trackNo)) {
      songs.set(trackNo, {
        trackNo,
        title,
        versions: [],
      })
    }
    
    // Look for matching cover image for this version
    const baseName = audioFile.replace(/\.(wav|mp3|flac|ogg)$/i, '')
    const possibleCovers = [
      `${baseName}.jpg`,
      `${baseName}.jpeg`,
      `${baseName}.png`,
      `${baseName}.webp`,
    ]
    
    let versionCoverPath: string | undefined
    for (const coverName of possibleCovers) {
      const coverPath = path.join(albumPath, coverName)
      if (fs.existsSync(coverPath)) {
        versionCoverPath = coverPath
        break
      }
    }
    
    songs.get(trackNo)!.versions.push({
      label: version,
      filePath: path.join(albumPath, audioFile),
      coverPath: versionCoverPath,
    })
  }
  
  return {
    slug,
    title: prettifyName(slug),
    coverPath: path.join(albumPath, coverFile),
    songs,
  }
}

async function fetchDatabaseState(): Promise<{ albums: DbAlbum[]; songs: DbSong[]; versions: DbVersion[] }> {
  // Fetch all albums
  const { data: albums, error: albumsError } = await supabase
    .from('albums')
    .select('*')
  
  if (albumsError) {
    console.error('❌ Error fetching albums:', albumsError.message)
    return { albums: [], songs: [], versions: [] }
  }
  
  // Fetch all songs
  const { data: songs, error: songsError } = await supabase
    .from('songs')
    .select('*')
  
  if (songsError) {
    console.error('❌ Error fetching songs:', songsError.message)
    return { albums: albums || [], songs: [], versions: [] }
  }
  
  // Fetch all versions
  const { data: versions, error: versionsError } = await supabase
    .from('song_versions')
    .select('*')
  
  if (versionsError) {
    console.error('❌ Error fetching versions:', versionsError.message)
    return { albums: albums || [], songs: songs || [], versions: [] }
  }
  
  return {
    albums: albums || [],
    songs: songs || [],
    versions: versions || []
  }
}

function detectChanges(
  localAlbums: Map<string, AlbumData>,
  dbState: { albums: DbAlbum[]; songs: DbSong[]; versions: DbVersion[] }
): SyncChanges {
  const changes: SyncChanges = {
    albumsToAdd: [],
    albumsToDelete: [],
    songsToAdd: [],
    songsToDelete: [],
    songsToUpdate: [],
    versionsToAdd: [],
    versionsToDelete: [],
    versionsToUpdate: []
  }
  
  // Create lookup maps
  const dbAlbumsMap = new Map(dbState.albums.map(a => [a.slug, a]))
  const dbSongsByAlbum = new Map<string, DbSong[]>()
  const dbVersionsBySong = new Map<string, DbVersion[]>()
  
  for (const song of dbState.songs) {
    if (!dbSongsByAlbum.has(song.album_id)) {
      dbSongsByAlbum.set(song.album_id, [])
    }
    dbSongsByAlbum.get(song.album_id)!.push(song)
  }
  
  for (const version of dbState.versions) {
    if (!dbVersionsBySong.has(version.song_id)) {
      dbVersionsBySong.set(version.song_id, [])
    }
    dbVersionsBySong.get(version.song_id)!.push(version)
  }
  
  // Detect albums to add
  for (const [slug, albumData] of localAlbums) {
    if (!dbAlbumsMap.has(slug)) {
      changes.albumsToAdd.push(albumData)
    }
  }
  
  // Detect albums to delete
  for (const dbAlbum of dbState.albums) {
    if (!localAlbums.has(dbAlbum.slug)) {
      changes.albumsToDelete.push(dbAlbum)
    }
  }
  
  // Detect song and version changes for existing albums
  for (const [slug, localAlbum] of localAlbums) {
    const dbAlbum = dbAlbumsMap.get(slug)
    if (!dbAlbum) continue // New album, already handled
    
    const dbSongs = dbSongsByAlbum.get(dbAlbum.id) || []
    const localSongsArray = Array.from(localAlbum.songs.values())
    
    // Create lookup by track number for comparison
    const dbSongsByTrack = new Map(dbSongs.map(s => [s.track_no, s]))
    const localSongsByTrack = new Map(localSongsArray.map(s => [s.trackNo, s]))
    
    // Detect songs to add
    for (const localSong of localSongsArray) {
      if (!dbSongsByTrack.has(localSong.trackNo)) {
        changes.songsToAdd.push({ album: dbAlbum, song: localSong })
      }
    }
    
    // Detect songs to delete or update
    for (const dbSong of dbSongs) {
      const localSong = localSongsByTrack.get(dbSong.track_no)
      
      if (!localSong) {
        changes.songsToDelete.push({ album: dbAlbum, song: dbSong })
      } else if (dbSong.title !== localSong.title) {
        // Song renamed
        changes.songsToUpdate.push({ album: dbAlbum, oldSong: dbSong, newSong: localSong })
      }
      
      // Check versions for this song
      if (localSong) {
        const dbVersions = dbVersionsBySong.get(dbSong.id) || []
        const dbVersionsByLabel = new Map(dbVersions.map(v => [v.label, v]))
        const localVersionsByLabel = new Map(localSong.versions.map(v => [v.label, v]))
        
        // Detect versions to add
        for (const localVersion of localSong.versions) {
          if (!dbVersionsByLabel.has(localVersion.label)) {
            changes.versionsToAdd.push({ song: dbSong, version: localVersion })
          }
        }
        
        // Detect versions to delete
        for (const dbVersion of dbVersions) {
          if (!localVersionsByLabel.has(dbVersion.label)) {
            changes.versionsToDelete.push({ song: dbSong, version: dbVersion })
          }
        }
      }
    }
  }
  
  return changes
}

function displayChanges(changes: SyncChanges): void {
  console.log('\n📊 Changes detected:\n')
  
  let totalChanges = 0
  
  if (changes.albumsToAdd.length > 0) {
    console.log(`✓ ${changes.albumsToAdd.length} new album(s) to add:`)
    changes.albumsToAdd.forEach(a => console.log(`   • ${a.title}`))
    totalChanges += changes.albumsToAdd.length
  }
  
  if (changes.albumsToDelete.length > 0) {
    console.log(`✗ ${changes.albumsToDelete.length} album(s) to delete (removed locally):`)
    changes.albumsToDelete.forEach(a => console.log(`   • ${a.title}`))
    totalChanges += changes.albumsToDelete.length
  }
  
  if (changes.songsToAdd.length > 0) {
    console.log(`✓ ${changes.songsToAdd.length} new song(s) to add:`)
    changes.songsToAdd.forEach(s => console.log(`   • ${s.song.title} (${s.album.title})`))
    totalChanges += changes.songsToAdd.length
  }
  
  if (changes.songsToDelete.length > 0) {
    console.log(`✗ ${changes.songsToDelete.length} song(s) to delete:`)
    changes.songsToDelete.forEach(s => console.log(`   • ${s.song.title} (${s.album.title})`))
    totalChanges += changes.songsToDelete.length
  }
  
  if (changes.songsToUpdate.length > 0) {
    console.log(`⚠ ${changes.songsToUpdate.length} song(s) renamed:`)
    changes.songsToUpdate.forEach(s => console.log(`   • "${s.oldSong.title}" → "${s.newSong.title}" (${s.album.title})`))
    totalChanges += changes.songsToUpdate.length
  }
  
  if (changes.versionsToAdd.length > 0) {
    console.log(`✓ ${changes.versionsToAdd.length} new version(s) to add:`)
    changes.versionsToAdd.forEach(v => console.log(`   • ${v.song.title} - ${v.version.label}`))
    totalChanges += changes.versionsToAdd.length
  }
  
  if (changes.versionsToDelete.length > 0) {
    console.log(`✗ ${changes.versionsToDelete.length} version(s) to delete:`)
    changes.versionsToDelete.forEach(v => console.log(`   • ${v.song.title} - ${v.version.label}`))
    totalChanges += changes.versionsToDelete.length
  }
  
  if (totalChanges === 0) {
    console.log('✅ Everything is in sync! No changes needed.')
  }
  
  console.log()
}

async function applyChanges(changes: SyncChanges, forceMode: boolean): Promise<void> {
  console.log('🔄 Applying changes...\n')
  
  // Delete albums (if force mode)
  if (changes.albumsToDelete.length > 0) {
    if (forceMode) {
      console.log(`🗑️  Deleting ${changes.albumsToDelete.length} album(s)...`)
      for (const album of changes.albumsToDelete) {
        const { error } = await supabase
          .from('albums')
          .delete()
          .eq('id', album.id)
        
        if (error) {
          console.log(`   ❌ Failed to delete ${album.title}: ${error.message}`)
        } else {
          console.log(`   ✅ Deleted ${album.title}`)
        }
      }
    } else {
      console.log(`⚠️  Skipping ${changes.albumsToDelete.length} album deletion(s) (use --force to delete)`)
    }
  }
  
  // Delete songs (if force mode)
  if (changes.songsToDelete.length > 0) {
    if (forceMode) {
      console.log(`🗑️  Deleting ${changes.songsToDelete.length} song(s)...`)
      for (const { song, album } of changes.songsToDelete) {
        const { error } = await supabase
          .from('songs')
          .delete()
          .eq('id', song.id)
        
        if (error) {
          console.log(`   ❌ Failed to delete ${song.title}: ${error.message}`)
        } else {
          console.log(`   ✅ Deleted ${song.title} from ${album.title}`)
        }
      }
    } else {
      console.log(`⚠️  Skipping ${changes.songsToDelete.length} song deletion(s) (use --force to delete)`)
    }
  }
  
  // Delete versions (if force mode)
  if (changes.versionsToDelete.length > 0) {
    if (forceMode) {
      console.log(`🗑️  Deleting ${changes.versionsToDelete.length} version(s)...`)
      for (const { version, song } of changes.versionsToDelete) {
        const { error } = await supabase
          .from('song_versions')
          .delete()
          .eq('id', version.id)
        
        if (error) {
          console.log(`   ❌ Failed to delete ${song.title} - ${version.label}: ${error.message}`)
        } else {
          console.log(`   ✅ Deleted ${song.title} - ${version.label}`)
        }
      }
    } else {
      console.log(`⚠️  Skipping ${changes.versionsToDelete.length} version deletion(s) (use --force to delete)`)
    }
  }
  
  // Update songs (renames)
  if (changes.songsToUpdate.length > 0) {
    console.log(`✏️  Updating ${changes.songsToUpdate.length} song(s)...`)
    for (const { oldSong, newSong } of changes.songsToUpdate) {
      const { error } = await supabase
        .from('songs')
        .update({ title: newSong.title })
        .eq('id', oldSong.id)
      
      if (error) {
        console.log(`   ❌ Failed to update ${oldSong.title}: ${error.message}`)
      } else {
        console.log(`   ✅ Renamed "${oldSong.title}" → "${newSong.title}"`)
      }
    }
  }
  
  // Add new albums
  if (changes.albumsToAdd.length > 0) {
    console.log(`➕ Adding ${changes.albumsToAdd.length} new album(s)...`)
    for (const album of changes.albumsToAdd) {
      await addAlbum(album)
    }
  }
  
  // Add new songs
  if (changes.songsToAdd.length > 0) {
    console.log(`➕ Adding ${changes.songsToAdd.length} new song(s)...`)
    for (const { album, song } of changes.songsToAdd) {
      await addSong(album, song)
    }
  }
  
  // Add new versions
  if (changes.versionsToAdd.length > 0) {
    console.log(`➕ Adding ${changes.versionsToAdd.length} new version(s)...`)
    for (const { song, version } of changes.versionsToAdd) {
      await addVersion(song, version)
    }
  }
  
  console.log('\n✅ Sync complete!')
}

async function addAlbum(album: AlbumData): Promise<void> {
  try {
    // Upload cover
    const coverFileName = `${album.slug}${path.extname(album.coverPath)}`
    const coverUrl = await uploadFile('covers', album.coverPath, coverFileName)
    
    if (!coverUrl) {
      console.log(`   ❌ Failed to upload cover for ${album.title}`)
      return
    }
    
    // Extract palette
    album.palette = await extractPalette(coverUrl)
    
    // Insert album
    const { data: dbAlbum, error: albumError } = await supabase
      .from('albums')
      .insert({
        slug: album.slug,
        title: album.title,
        cover_url: coverUrl,
        palette: album.palette,
        is_public: true,
      })
      .select()
      .single()
    
    if (albumError) {
      console.log(`   ❌ Error creating album ${album.title}: ${albumError.message}`)
      return
    }
    
    console.log(`   ✅ Added album ${album.title}`)
    
    // Add all songs
    const sortedSongs = Array.from(album.songs.values()).sort((a, b) => a.trackNo - b.trackNo)
    for (const song of sortedSongs) {
      await addSong(dbAlbum, song)
    }
  } catch (error) {
    console.log(`   ❌ Error adding album ${album.title}: ${error}`)
  }
}

async function addSong(album: DbAlbum, song: SongData): Promise<void> {
  try {
    const { data: dbSong, error: songError } = await supabase
      .from('songs')
      .insert({
        album_id: album.id,
        title: song.title,
        track_no: song.trackNo,
      })
      .select()
      .single()
    
    if (songError) {
      console.log(`   ❌ Error creating song ${song.title}: ${songError.message}`)
      return
    }
    
    console.log(`   ✅ Added song ${song.title}`)
    
    // Add all versions
    for (const version of song.versions) {
      await addVersion(dbSong, version)
    }
  } catch (error) {
    console.log(`   ❌ Error adding song ${song.title}: ${error}`)
  }
}

async function addVersion(song: DbSong, version: VersionData): Promise<void> {
  try {
    // Get album slug from song
    const { data: songWithAlbum } = await supabase
      .from('songs')
      .select('album_id, albums(slug)')
      .eq('id', song.id)
      .single()
    
    if (!songWithAlbum) {
      console.log(`   ❌ Could not find album for song ${song.title}`)
      return
    }
    
    const albumSlug = (songWithAlbum.albums as any).slug
    const audioFileName = `${albumSlug}-${song.track_no}-${version.label.toLowerCase().replace(/\s+/g, '-')}${path.extname(version.filePath)}`
    const audioUrl = await uploadFile('audio', version.filePath, audioFileName)
    
    if (!audioUrl) {
      console.log(`   ❌ Failed to upload ${version.label} for ${song.title}`)
      return
    }
    
    // Upload version cover if it exists
    let versionCoverUrl: string | null = null
    if (version.coverPath) {
      const coverFileName = `${albumSlug}/${path.basename(version.coverPath)}`
      versionCoverUrl = await uploadFile('covers', version.coverPath, coverFileName)
      if (versionCoverUrl) {
        console.log(`   🎨 Uploaded version cover for ${version.label}`)
      }
    }
    
    const { error: versionError } = await supabase
      .from('song_versions')
      .insert({
        song_id: song.id,
        label: version.label,
        audio_url: audioUrl,
        cover_url: versionCoverUrl,
        duration_sec: null,
        waveform_json: null,
      })
    
    if (versionError) {
      console.log(`   ❌ Error creating version ${version.label}: ${versionError.message}`)
    } else {
      console.log(`   ✅ Added version ${song.title} - ${version.label}`)
    }
  } catch (error) {
    console.log(`   ❌ Error adding version ${version.label}: ${error}`)
  }
}

async function syncContent(contentDir: string) {
  console.log('\n🎵 Loki Tunes Content Sync')
  console.log(`Mode: ${forceMode ? '🔥 FORCE (will delete)' : '🛡️  SAFE (add/update only)'}\n`)
  
  // Validate content directory
  if (!fs.existsSync(contentDir)) {
    console.error(`❌ Error: Directory not found: ${contentDir}`)
    process.exit(1)
  }
  
  // Scan for album folders
  console.log('📁 Scanning local content...')
  const entries = fs.readdirSync(contentDir, { withFileTypes: true })
  const albumFolders = entries.filter(e => e.isDirectory())
  
  if (albumFolders.length === 0) {
    console.error(`❌ Error: No album folders found in ${contentDir}`)
    console.error(`\nExpected structure:`)
    console.error(`  ${contentDir}/`)
    console.error(`  ├── album-name-1/`)
    console.error(`  │   ├── cover.jpg`)
    console.error(`  │   └── 01-song.wav`)
    console.error(`  └── album-name-2/`)
    console.error(`      ├── cover.png`)
    console.error(`      └── 01-track.wav\n`)
    process.exit(1)
  }
  
  // Scan all local albums
  const localAlbums = new Map<string, AlbumData>()
  
  for (const folder of albumFolders) {
    const albumPath = path.join(contentDir, folder.name)
    const slug = folder.name
    const albumData = scanAlbumFolder(albumPath, slug)
    
    if (albumData) {
      localAlbums.set(slug, albumData)
    }
  }
  
  console.log(`   Found ${localAlbums.size} valid album(s) locally\n`)
  
  // Fetch database state
  console.log('🗄️  Fetching database state...')
  const dbState = await fetchDatabaseState()
  console.log(`   Found ${dbState.albums.length} album(s) in database\n`)
  
  // Detect changes
  console.log('🔍 Detecting changes...')
  const changes = detectChanges(localAlbums, dbState)
  
  // Display changes
  displayChanges(changes)
  
  // Check if there are any changes
  const hasChanges = 
    changes.albumsToAdd.length > 0 ||
    changes.albumsToDelete.length > 0 ||
    changes.songsToAdd.length > 0 ||
    changes.songsToDelete.length > 0 ||
    changes.songsToUpdate.length > 0 ||
    changes.versionsToAdd.length > 0 ||
    changes.versionsToDelete.length > 0
  
  if (!hasChanges) {
    console.log('💡 Everything is already in sync!\n')
    return
  }
  
  // Check if there are destructive changes
  const hasDestructiveChanges = 
    changes.albumsToDelete.length > 0 ||
    changes.songsToDelete.length > 0 ||
    changes.versionsToDelete.length > 0
  
  if (hasDestructiveChanges && !forceMode) {
    console.log('⚠️  Destructive changes detected but not in --force mode.')
    console.log('   Run with --force to apply deletions.\n')
  }
  
  // Prompt for confirmation
  const answer = await promptUser('Continue with sync? (y/n): ')
  
  if (answer !== 'y' && answer !== 'yes') {
    console.log('\n❌ Sync cancelled.\n')
    return
  }
  
  // Apply changes
  await applyChanges(changes, forceMode)
  
  console.log('\n💡 Visit your site to see the changes!\n')
}

// Main execution
if (!contentDirArg) {
  console.error('❌ Error: Please provide a content directory')
  console.error('\nUsage: pnpm sync-content <directory> [--force]')
  console.error('Example: pnpm sync-content ~/loki-content')
  console.error('Example: pnpm sync-content ~/loki-content --force')
  console.error('\nFlags:')
  console.error('  --force    Enable destructive operations (delete missing content)')
  console.error('\nExpected structure:')
  console.error('  ~/loki-content/')
  console.error('  ├── first-album/')
  console.error('  │   ├── cover.jpg')
  console.error('  │   ├── 01-song-original.wav')
  console.error('  │   └── 01-song-remix.wav')
  console.error('  └── second-album/')
  console.error('      ├── cover.png')
  console.error('      └── 01-track.wav\n')
  process.exit(1)
}

syncContent(path.resolve(contentDirArg))
