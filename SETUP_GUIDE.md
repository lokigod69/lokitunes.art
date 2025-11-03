# Loki Tunes Setup Guide

Complete step-by-step guide to get Loki Tunes running.

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- A Supabase account (free tier works)
- Album artwork images
- Audio files (WAV format recommended)

## Step 1: Supabase Project Setup

### Create Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose organization and project name (e.g., "lokitunes")
4. Set a strong database password (save this!)
5. Choose a region close to your users
6. Wait for project to finish setting up (~2 minutes)

### Run Database Schema

1. In your Supabase project, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql` from this project
4. Paste into the SQL editor
5. Click "Run" or press Ctrl+Enter
6. You should see success messages for all tables created

### Create Storage Buckets

1. Go to **Storage** in the Supabase dashboard
2. Click "New Bucket"
3. Create bucket named `covers`:
   - Name: `covers`
   - Public bucket: **Yes**
   - Click "Create bucket"
4. Create bucket named `audio`:
   - Name: `audio`
   - Public bucket: **Yes**
   - Click "Create bucket"

### Get API Credentials

1. Go to **Settings** > **API**
2. Copy these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 2: Local Project Setup

### Install Dependencies

```bash
cd lokitunes
pnpm install
```

### Configure Environment Variables

1. Copy the example env file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 3: Upload Content

### Upload Album Covers

1. In Supabase Dashboard > **Storage** > **covers**
2. Click "Upload file"
3. Upload your album cover images (JPG or PNG)
4. Note the file paths (e.g., `first-thoughts.jpg`)

### Upload Audio Files

1. In Supabase Dashboard > **Storage** > **audio**
2. Click "Upload file"
3. Upload your WAV files
4. Note the file paths (e.g., `opening-original.wav`)

### Insert Album Data

1. Go to **Table Editor** > **albums**
2. Click "Insert row"
3. Fill in:
   - **slug**: URL-friendly name (e.g., `first-thoughts`)
   - **title**: Display name (e.g., `First Thoughts`)
   - **cover_url**: Full path from storage (e.g., `https://your-project.supabase.co/storage/v1/object/public/covers/first-thoughts.jpg`)
   - **palette**: Leave null for now (will auto-extract)
   - **is_public**: `true`
4. Click "Save"

### Insert Songs

1. Go to **Table Editor** > **songs**
2. Click "Insert row"
3. Fill in:
   - **album_id**: Select the album you just created
   - **title**: Song name (e.g., `Opening`)
   - **track_no**: Track number (e.g., `1`)
4. Click "Save"
5. Repeat for all songs

### Insert Song Versions

1. Go to **Table Editor** > **song_versions**
2. Click "Insert row"
3. Fill in:
   - **song_id**: Select the song
   - **label**: Version name (e.g., `Original`, `Remix 1`)
   - **audio_url**: Full path from storage (e.g., `https://your-project.supabase.co/storage/v1/object/public/audio/opening-original.wav`)
   - **duration_sec**: Duration in seconds (optional)
   - **waveform_json**: Leave null (will generate on first play)
4. Click "Save"
5. Repeat for all versions

## Step 4: Run the Application

### Start Development Server

```bash
pnpm dev
```

### Open in Browser

Navigate to [http://localhost:3000](http://localhost:3000)

You should see:
- The "LOKI TUNES" logo at the top
- Floating orbs representing your albums (if WebGL is supported)
- Or a grid of album covers (fallback mode)

### Test Functionality

1. **Hover over an orb** - Should show album title
2. **Click an orb** - Should navigate to album page
3. **Click a song** - Should expand to show versions
4. **Click play** - Should load waveform and play audio
5. **Press spacebar** - Should pause/play
6. **Check mini-player** - Should appear at bottom when playing

## Step 5: Extract Color Palettes (Optional)

To automatically extract color palettes from album covers:

1. Make a POST request to `/api/extract-palette`:
   ```bash
   curl -X POST http://localhost:3000/api/extract-palette \
     -H "Content-Type: application/json" \
     -d '{"imageUrl": "https://your-project.supabase.co/storage/v1/object/public/covers/first-thoughts.jpg"}'
   ```

2. Copy the returned palette JSON
3. Update the album in Supabase Table Editor:
   - Go to **albums** table
   - Edit the album row
   - Paste the palette JSON into the **palette** column
   - Save

## Troubleshooting

### Orbs Not Appearing

- Check browser console for errors
- Verify Supabase credentials in `.env.local`
- Ensure albums have `is_public = true`
- Check that WebGL is supported (try fallback mode)

### Audio Not Playing

- Verify audio URLs are publicly accessible
- Check browser console for CORS errors
- Ensure audio files are in a supported format (WAV, MP3)
- Try opening audio URL directly in browser

### Images Not Loading

- Verify cover URLs are publicly accessible
- Check storage bucket is set to public
- Ensure correct file paths in database

### Database Connection Errors

- Verify Supabase URL and key are correct
- Check that RLS policies are enabled
- Ensure tables were created successfully

## Next Steps

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Add More Content

- Upload more albums, songs, and versions
- Experiment with different album cover styles
- Add descriptions or metadata

### Customize

- Modify color palette in `app/globals.css`
- Adjust orb physics in `components/SonicOrb.tsx`
- Change logo style in `components/Logo3D.tsx`

## Support

For issues or questions:
- Check the main README.md
- Review the spec in LOKITUNES_MVP_SPEC_V2.md
- Check Supabase documentation for database issues
