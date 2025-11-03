#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { Vibrant } from 'node-vibrant/node'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

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
  audioUrl?: string
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
    const { data: existingFiles } = await supabase.storage
      .from(bucket)
      .list('', { search: fileName })
    
    if (existingFiles && existingFiles.length > 0) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
      return data.publicUrl
    }

    // Upload new file
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
    
    songs.get(trackNo)!.versions.push({
      label: version,
      filePath: path.join(albumPath, audioFile),
    })
  }
  
  return {
    slug,
    title: prettifyName(slug),
    coverPath: path.join(albumPath, coverFile),
    songs,
  }
}

async function syncAlbum(album: AlbumData): Promise<{ success: boolean; songCount: number; versionCount: number }> {
  let songCount = 0
  let versionCount = 0
  
  try {
    // Upload cover
    const coverFileName = `${album.slug}${path.extname(album.coverPath)}`
    const coverUrl = await uploadFile('covers', album.coverPath, coverFileName)
    
    if (!coverUrl) {
      console.log(`   ❌ Failed to upload cover`)
      return { success: false, songCount: 0, versionCount: 0 }
    }
    
    album.coverUrl = coverUrl
    
    // Extract palette
    console.log(`   🎨 Extracting color palette...`)
    album.palette = await extractPalette(coverUrl)
    
    // Check if album already exists
    const { data: existingAlbum } = await supabase
      .from('albums')
      .select('id')
      .eq('slug', album.slug)
      .single()
    
    if (existingAlbum) {
      console.log(`   ⏭️  Album already exists, skipping...`)
      return { success: false, songCount: 0, versionCount: 0 }
    }
    
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
      console.log(`   ❌ Error creating album: ${albumError.message}`)
      return { success: false, songCount: 0, versionCount: 0 }
    }
    
    // Process songs
    const sortedSongs = Array.from(album.songs.values()).sort((a, b) => a.trackNo - b.trackNo)
    
    for (const song of sortedSongs) {
      // Insert song
      const { data: dbSong, error: songError } = await supabase
        .from('songs')
        .insert({
          album_id: dbAlbum.id,
          title: song.title,
          track_no: song.trackNo,
        })
        .select()
        .single()
      
      if (songError) {
        console.log(`      ❌ Error creating song: ${songError.message}`)
        continue
      }
      
      songCount++
      
      // Upload and insert versions
      for (const version of song.versions) {
        const audioFileName = `${album.slug}-${song.trackNo}-${version.label.toLowerCase().replace(/\s+/g, '-')}${path.extname(version.filePath)}`
        const audioUrl = await uploadFile('audio', version.filePath, audioFileName)
        
        if (!audioUrl) continue
        
        version.audioUrl = audioUrl
        
        const { error: versionError } = await supabase
          .from('song_versions')
          .insert({
            song_id: dbSong.id,
            label: version.label,
            audio_url: audioUrl,
            duration_sec: null,
            waveform_json: null,
          })
        
        if (!versionError) {
          versionCount++
        }
      }
    }
    
    return { success: true, songCount, versionCount }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`)
    return { success: false, songCount: 0, versionCount: 0 }
  }
}

async function syncContent(contentDir: string) {
  console.log('\n🎵 Loki Tunes Content Sync\n')
  
  // Validate content directory
  if (!fs.existsSync(contentDir)) {
    console.error(`❌ Error: Directory not found: ${contentDir}`)
    process.exit(1)
  }
  
  // Scan for album folders
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
  
  console.log(`📁 Found ${albumFolders.length} album folder(s)\n`)
  
  const results: { album: string; success: boolean; songs: number; versions: number; error?: string }[] = []
  
  for (const folder of albumFolders) {
    const albumPath = path.join(contentDir, folder.name)
    const slug = folder.name
    
    console.log(`📀 ${prettifyName(slug)}`)
    
    // Scan album folder
    const albumData = scanAlbumFolder(albumPath, slug)
    
    if (!albumData) {
      const files = fs.readdirSync(albumPath)
      const hasCover = files.some(f => f.toLowerCase().startsWith('cover.') && isImageFile(f))
      const hasAudio = files.some(isAudioFile)
      
      if (!hasCover) {
        console.log(`   ❌ No cover image found (need cover.jpg or cover.png)`)
        results.push({ album: prettifyName(slug), success: false, songs: 0, versions: 0, error: 'No cover image' })
      } else if (!hasAudio) {
        console.log(`   ❌ No audio files found`)
        results.push({ album: prettifyName(slug), success: false, songs: 0, versions: 0, error: 'No audio files' })
      }
      console.log()
      continue
    }
    
    // Sync album
    const result = await syncAlbum(albumData)
    
    if (result.success) {
      console.log(`   ✅ ${result.songCount} song(s), ${result.versionCount} version(s) uploaded`)
      if (albumData.palette) {
        console.log(`   🎨 Palette: ${albumData.palette.accent1}, ${albumData.palette.dominant}, ${albumData.palette.accent2}`)
      }
      results.push({ album: albumData.title, success: true, songs: result.songCount, versions: result.versionCount })
    } else {
      results.push({ album: albumData.title, success: false, songs: 0, versions: 0, error: 'Upload failed' })
    }
    
    console.log()
  }
  
  // Summary
  console.log('━'.repeat(60))
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  
  if (successful.length > 0) {
    console.log(`\n✅ Successfully added ${successful.length} album(s):`)
    successful.forEach(r => {
      console.log(`   • ${r.album} (${r.songs} songs, ${r.versions} versions)`)
    })
  }
  
  if (failed.length > 0) {
    console.log(`\n⏭️  Skipped ${failed.length} album(s):`)
    failed.forEach(r => {
      console.log(`   • ${r.album} - ${r.error}`)
    })
  }
  
  console.log(`\n💡 Visit your site to see the new orbs!\n`)
}

// Main execution
const contentDir = process.argv[2]

if (!contentDir) {
  console.error('❌ Error: Please provide a content directory')
  console.error('\nUsage: pnpm sync-content <directory>')
  console.error('Example: pnpm sync-content ~/loki-content')
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

syncContent(path.resolve(contentDir))
