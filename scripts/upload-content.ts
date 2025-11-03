#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
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
  uploadedAt: string
}

async function uploadFile(
  bucket: string,
  filePath: string,
  fileName: string
): Promise<string | null> {
  try {
    const fileBuffer = fs.readFileSync(filePath)
    
    // Check if file already exists
    const { data: existingFiles } = await supabase.storage
      .from(bucket)
      .list('', { search: fileName })
    
    if (existingFiles && existingFiles.length > 0) {
      console.log(`   ⏭️  Skipped (already exists): ${fileName}`)
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
      console.error(`   ❌ Failed to upload ${fileName}:`, error.message)
      return null
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
    console.log(`   ✅ Uploaded: ${fileName}`)
    return urlData.publicUrl
  } catch (error) {
    console.error(`   ❌ Error uploading ${fileName}:`, error)
    return null
  }
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

function isImageFile(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase()
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)
}

function isAudioFile(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase()
  return ['.wav', '.mp3', '.ogg', '.flac'].includes(ext)
}

async function uploadContent(contentDir: string) {
  console.log('\n🎵 Loki Tunes Content Uploader\n')
  
  // Validate content directory
  if (!fs.existsSync(contentDir)) {
    console.error(`❌ Error: Directory not found: ${contentDir}`)
    process.exit(1)
  }

  const files = fs.readdirSync(contentDir)
  const imageFiles = files.filter(isImageFile)
  const audioFiles = files.filter(isAudioFile)

  console.log(`📁 Found ${imageFiles.length} images and ${audioFiles.length} audio files\n`)

  const contentMap: ContentMap = {
    covers: {},
    audio: {},
    uploadedAt: new Date().toISOString(),
  }

  // Upload images
  if (imageFiles.length > 0) {
    console.log('📸 Uploading images to covers bucket...')
    for (let i = 0; i < imageFiles.length; i++) {
      const fileName = imageFiles[i]
      const filePath = path.join(contentDir, fileName)
      console.log(`   [${i + 1}/${imageFiles.length}] ${fileName}`)
      
      const url = await uploadFile('covers', filePath, fileName)
      if (url) {
        contentMap.covers[fileName] = url
      }
    }
    console.log()
  }

  // Upload audio files
  if (audioFiles.length > 0) {
    console.log('🎵 Uploading audio to audio bucket...')
    for (let i = 0; i < audioFiles.length; i++) {
      const fileName = audioFiles[i]
      const filePath = path.join(contentDir, fileName)
      console.log(`   [${i + 1}/${audioFiles.length}] ${fileName}`)
      
      const url = await uploadFile('audio', filePath, fileName)
      if (url) {
        contentMap.audio[fileName] = url
      }
    }
    console.log()
  }

  // Save content map
  const mapPath = path.join(process.cwd(), 'content-map.json')
  fs.writeFileSync(mapPath, JSON.stringify(contentMap, null, 2))
  
  console.log('✅ Upload complete!')
  console.log(`📝 Content map saved to: content-map.json`)
  console.log(`\n📊 Summary:`)
  console.log(`   Images: ${Object.keys(contentMap.covers).length} uploaded`)
  console.log(`   Audio:  ${Object.keys(contentMap.audio).length} uploaded`)
  console.log(`\n💡 Next step: Create albums-to-add.json and run: pnpm seed-albums albums-to-add.json\n`)
}

// Main execution
const contentDir = process.argv[2]

if (!contentDir) {
  console.error('❌ Error: Please provide a content directory')
  console.error('\nUsage: pnpm upload-content <directory>')
  console.error('Example: pnpm upload-content ~/loki-tunes-content\n')
  process.exit(1)
}

uploadContent(path.resolve(contentDir))
