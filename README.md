# Loki Tunes — Sonic Resonance

A sonic landscape where albums exist as resonant nodes. This isn't a music library—it's an immersive experience where visitors attune to musical evolution through 3D orb fields.

## Philosophy

Musical evolution as consciousness crystallization—each remix is a facet of the same diamond, reflecting different frequencies of the original vision.

## Features

- **3D Orb Field**: Interactive physics-based orb field using react-three-fiber and Rapier
- **Sonic Immersion**: Album pages with waveform players for each song version
- **Crossfade Audio**: Smooth 400ms crossfade when switching between versions
- **Reduced Motion Support**: Automatic fallback to static grid for accessibility
- **Keyboard Shortcuts**: Space to play/pause, arrows to seek
- **Persistent Volume**: Volume settings saved to localStorage

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS 4
- **3D**: react-three-fiber + drei + @react-three/rapier
- **Audio**: WaveSurfer.js 7.x
- **State**: Zustand
- **Backend**: Supabase (PostgreSQL + Storage)
- **Color Extraction**: node-vibrant
- **Icons**: Lucide React

## Setup Instructions

### 1. Clone and Install

```bash
cd lokitunes
pnpm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema in Supabase SQL Editor:
   ```bash
   # Copy contents of supabase-schema.sql and run in Supabase SQL Editor
   ```
3. Create storage buckets in Supabase Dashboard > Storage:
   - `audio` (public)
   - `covers` (public)
4. Get your project URL and anon key from Settings > API

### 3. Environment Variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Add Content

Use the built-in content management scripts:

```bash
# 1. Upload your files to Supabase
pnpm upload-content ~/path/to/your/content

# 2. Create albums-to-add.json (see albums-to-add.example.json)
cp albums-to-add.example.json albums-to-add.json
# Edit albums-to-add.json with your album info

# 3. Seed the database
pnpm seed-albums albums-to-add.json
```

**See [ADDING_CONTENT.md](ADDING_CONTENT.md) for detailed instructions.**

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the orb field.

## Project Structure

```
/app
  /page.tsx                         # Orb field landing
  /album/[slug]/page.tsx            # Album immersion
  /api/extract-palette/route.ts     # Color extraction endpoint
  /donate/page.tsx                  # Donation placeholder
  
/components
  /Logo3D.tsx                       # Liquid chrome wordmark
  /OrbField.tsx                     # R3F scene with physics
  /SonicOrb.tsx                     # Individual orb + attraction logic
  /WaveformPlayer.tsx               # Wavesurfer + controls
  /SongRow.tsx                      # Expandable song with versions
  /MiniPlayer.tsx                   # Sticky bottom player
  
/lib
  /supabase.ts                      # Supabase client + types
  /queries.ts                       # Database queries
  /colors.ts                        # Palette extraction
  /audio-store.ts                   # Zustand audio state
  /utils.ts                         # Utility functions
```

## Color Palette

```
void      #090B0D  // deeper than black, spatial depth
bone      #EBE4D8  // warm off-white, analog not digital
voltage   #4F9EFF  // electric blue
ember     #FF6B4A  // coral accent for interactions
```

Album pages dynamically extract 3-color palettes from cover art.

## Keyboard Shortcuts

- **Space**: Play/Pause
- **← / →**: Seek ±5s (coming soon)
- **↑ / ↓**: Volume (coming soon)

## Accessibility

- High contrast mode support
- Reduced motion fallback to static grid
- Keyboard navigation with visible focus states
- ARIA labels for screen readers

## Deploy on Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Future Enhancements

- Play count visualization as orb glow intensity
- Download original WAV option
- Remix lineage tree visualization
- Comment threads per version
- Art gallery section (Loki Layer)
