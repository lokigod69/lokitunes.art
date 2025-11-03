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

interface ContentMap {
  covers: Record<string, string>
  audio: Record<string, string>
}

interface AlbumInput {
  slug: string
  title: string
  cover_file: string
  accent_hex?: string
  songs: SongInput[]
}

interface SongInput {
  title: string
  track_no: number
  versions: VersionInput[]
}

interface VersionInput {
  label: string
  audio_file: string
}

async function extractPalette(imageUrl: string, accentHex?: string): Promise<any> {
  try {
    const palette = await Vibrant.from(imageUrl).getPalette()
    
    return {
      dominant: palette.DarkMuted?.hex || palette.Muted?.hex || '#090B0D',
      accent1: accentHex || palette.Vibrant?.hex || palette.LightVibrant?.hex || '#4F9EFF',
      accent2: palette.DarkVibrant?.hex || palette.LightMuted?.hex || '#FF6B4A',
    }
  } catch (error) {
    console.warn('   ⚠️  Could not extract palette, using defaults')
    return {
      dominant: '#090B0D',
      accent1: accentHex || '#4F9EFF',
      accent2: '#FF6B4A',
    }
  }
}

async function seedAlbums(inputFile: string) {
  console.log('\n🎵 Loki Tunes Album Seeder\n')

  // Load content map
  const mapPath = path.join(process.cwd(), 'content-map.json')
  if (!fs.existsSync(mapPath)) {
    console.error('❌ Error: content-map.json not found')
    console.error('Please run: pnpm upload-content <directory> first\n')
    process.exit(1)
  }

  const contentMap: ContentMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'))

  // Load albums input
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Error: Input file not found: ${inputFile}`)
    process.exit(1)
  }

  const albums: AlbumInput[] = JSON.parse(fs.readFileSync(inputFile, 'utf-8'))
  console.log(`📚 Found ${albums.length} album(s) to seed\n`)

  for (const albumInput of albums) {
    console.log(`📀 Processing album: ${albumInput.title}`)

    // Get cover URL from content map
    const coverUrl = contentMap.covers[albumInput.cover_file]
    if (!coverUrl) {
      console.error(`   ❌ Cover file not found in content map: ${albumInput.cover_file}`)
      console.error(`   Available covers: ${Object.keys(contentMap.covers).join(', ')}`)
      continue
    }

    // Extract color palette
    console.log('   🎨 Extracting color palette...')
    const palette = await extractPalette(coverUrl, albumInput.accent_hex)

    // Insert album
    const { data: album, error: albumError } = await supabase
      .from('albums')
      .insert({
        slug: albumInput.slug,
        title: albumInput.title,
        cover_url: coverUrl,
        palette: palette,
        is_public: true,
      })
      .select()
      .single()

    if (albumError) {
      if (albumError.code === '23505') {
        console.error(`   ❌ Album with slug "${albumInput.slug}" already exists`)
      } else {
        console.error(`   ❌ Error creating album:`, albumError.message)
      }
      continue
    }

    console.log(`   ✅ Created album: ${album.title}`)

    // Insert songs and versions
    for (const songInput of albumInput.songs) {
      console.log(`   📝 Adding song: ${songInput.title}`)

      const { data: song, error: songError } = await supabase
        .from('songs')
        .insert({
          album_id: album.id,
          title: songInput.title,
          track_no: songInput.track_no,
        })
        .select()
        .single()

      if (songError) {
        console.error(`      ❌ Error creating song:`, songError.message)
        continue
      }

      // Insert versions
      for (const versionInput of songInput.versions) {
        const audioUrl = contentMap.audio[versionInput.audio_file]
        if (!audioUrl) {
          console.error(`      ❌ Audio file not found: ${versionInput.audio_file}`)
          continue
        }

        const { error: versionError } = await supabase
          .from('song_versions')
          .insert({
            song_id: song.id,
            label: versionInput.label,
            audio_url: audioUrl,
            duration_sec: null, // Will be calculated by player on first load
            waveform_json: null,
          })

        if (versionError) {
          console.error(`      ❌ Error creating version:`, versionError.message)
        } else {
          console.log(`      ✅ Added version: ${versionInput.label}`)
        }
      }
    }

    console.log()
  }

  console.log('✅ Seeding complete!')
  console.log(`\n💡 Visit your site to see the new albums!\n`)
}

// Main execution
const inputFile = process.argv[2]

if (!inputFile) {
  console.error('❌ Error: Please provide an input file')
  console.error('\nUsage: pnpm seed-albums <input-file>')
  console.error('Example: pnpm seed-albums albums-to-add.json\n')
  process.exit(1)
}

seedAlbums(path.resolve(inputFile))
