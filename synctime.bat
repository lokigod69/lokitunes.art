import { createClient } from '@supabase/supabase-js'

// Use service role key for write access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // Need service role for updates
)

async function getAudioDuration(url: string): Promise<number | null> {
  return new Promise((resolve) => {
    const audio = new Audio()
    
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration)
    })
    
    audio.addEventListener('error', () => {
      console.error(`Failed to load: ${url}`)
      resolve(null)
    })
    
    // Timeout after 30 seconds
    setTimeout(() => {
      console.error(`Timeout loading: ${url}`)
      resolve(null)
    }, 30000)
    
    audio.src = url
  })
}

async function populateDurations() {
  console.log('Fetching song versions...')
  
  // Get all versions without duration
  const { data: versions, error } = await supabase
    .from('song_versions')
    .select('id, label, audio_url, duration_sec')
    .or('duration_sec.is.null,duration_sec.eq.0')
  
  if (error) {
    console.error('Failed to fetch versions:', error)
    return
  }
  
  console.log(`Found ${versions?.length || 0} versions without duration`)
  
  for (const version of versions || []) {
    if (!version.audio_url) {
      console.log(`Skipping ${version.label} - no audio URL`)
      continue
    }
    
    console.log(`Processing: ${version.label}...`)
    
    const duration = await getAudioDuration(version.audio_url)
    
    if (duration && duration > 0) {
      const { error: updateError } = await supabase
        .from('song_versions')
        .update({ duration_sec: Math.round(duration) })
        .eq('id', version.id)
      
      if (updateError) {
        console.error(`Failed to update ${version.label}:`, updateError)
      } else {
        console.log(`✓ ${version.label}: ${Math.round(duration)}s`)
      }
    } else {
      console.log(`✗ ${version.label}: Could not get duration`)
    }
  }
  
  console.log('Done!')
}

populateDurations()