# Version Cover Art Guide

## Overview

Each song version can now have its own unique cover art (e.g., Suno-generated images). This allows you to visually distinguish between different versions like Original, Remix, Acoustic, etc.

## Database Setup

### For New Installations

The schema already includes `cover_url` in the `song_versions` table. Just run the main schema:

```sql
-- Already included in supabase-schema.sql
```

### For Existing Databases

Run this migration in your Supabase SQL Editor:

```sql
-- Add cover_url column to song_versions
ALTER TABLE public.song_versions ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.song_versions.cover_url IS 'Optional cover art URL specific to this version (e.g., Suno-generated art)';
```

## Folder Structure

Organize your content like this:

```
album-name/
├── cover.jpg                     ← Album cover (required, for orb)
├── 01-song-original.wav          ← Audio file
├── 01-song-original.jpg          ← Version cover (optional)
├── 01-song-remix.wav             ← Audio file
├── 01-song-remix.jpg             ← Version cover (optional)
├── 02-another-song.wav
└── 02-another-song.png           ← Version cover (optional)
```

### Naming Rules

**Version covers must match the audio filename:**
- Audio: `01-song-original.wav`
- Cover: `01-song-original.jpg` (or `.png`, `.jpeg`, `.webp`)

**Supported image formats:**
- `.jpg` / `.jpeg`
- `.png`
- `.webp`

## How It Works

### 1. Sync Script Detection

When you run `pnpm sync-content`, the script:

1. Scans for audio files
2. For each audio file, looks for matching image:
   - `01-song-original.wav` → looks for `01-song-original.jpg`, `.png`, etc.
3. If found, uploads both audio and cover to Supabase
4. Stores the cover URL in the `song_versions` table

### 2. Upload Process

```
Local:  01-song-original.wav + 01-song-original.jpg
   ↓
Sync:   Detects matching files
   ↓
Upload: audio → audio bucket
        cover → covers/album-name/01-song-original.jpg
   ↓
DB:     Stores both URLs in song_versions table
```

### 3. UI Display

Version covers appear as thumbnails in the song version list:

```
📀 Song Title
  ┌────┐
  │ 🎨 │ Original          ▶️ [waveform]
  └────┘
  ┌────┐
  │ 🎨 │ Remix 1           ▶️ [waveform]
  └────┘
```

## Examples

### Example 1: All Versions Have Covers

```
first-album/
├── cover.jpg
├── 01-opening-original.wav
├── 01-opening-original.jpg       ← Suno art for original
├── 01-opening-remix.wav
├── 01-opening-remix.jpg          ← Suno art for remix
├── 02-reflection-original.wav
└── 02-reflection-original.png    ← Suno art for original
```

**Result:** Each version displays its unique cover art.

### Example 2: Mixed (Some Have Covers)

```
second-album/
├── cover.jpg
├── 01-dreams-original.wav
├── 01-dreams-original.jpg        ← Has cover
├── 01-dreams-acoustic.wav        ← No cover
└── 02-awake-original.wav         ← No cover
```

**Result:** 
- "Dreams - Original" shows its cover
- "Dreams - Acoustic" shows no thumbnail
- "Awake - Original" shows no thumbnail

### Example 3: No Version Covers

```
third-album/
├── cover.jpg
├── 01-song.wav                   ← No cover
└── 02-track.wav                  ← No cover
```

**Result:** Works perfectly! Version covers are optional.

## Sync Output

When syncing with version covers:

```
🎵 Loki Tunes Content Sync

📁 Scanning local content...
   Found 1 valid album(s) locally

🔄 Applying changes...

➕ Adding 1 new album(s)...
   ✅ Added album First Album
   ✅ Added song Opening
   ✅ Added version Opening - Original
   🎨 Uploaded version cover for Original    ← Version cover uploaded!
   ✅ Added version Opening - Remix
   🎨 Uploaded version cover for Remix       ← Version cover uploaded!

✅ Sync complete!
```

## Best Practices

### 1. Consistent Naming

✅ **Good:**
```
01-song-original.wav
01-song-original.jpg
```

❌ **Bad:**
```
01-song-original.wav
song-original.jpg          ← Won't match (missing track number)
```

### 2. Image Quality

- **Recommended size:** 500x500px to 1000x1000px
- **Format:** JPG for photos, PNG for graphics
- **File size:** Keep under 500KB per image
- **Aspect ratio:** Square (1:1) works best

### 3. Suno Integration

If you're using Suno to generate cover art:

1. Generate your song with Suno
2. Download the generated cover art
3. Rename it to match your audio file:
   - Audio: `01-dreams-original.wav`
   - Cover: `01-dreams-original.jpg`
4. Place both in your album folder
5. Run sync!

### 4. Storage Considerations

**Supabase Free Tier:**
- 1GB total storage
- Version covers stored in `covers` bucket
- Path: `covers/album-slug/version-filename.jpg`

**Estimate:**
- Album cover: ~200KB
- Version cover: ~300KB each
- 10 albums × 3 versions each = ~10MB

You have plenty of room!

## Troubleshooting

### Version Cover Not Showing

**Check:**
1. File exists in local folder
2. Filename matches exactly (case-sensitive on some systems)
3. File extension is supported (`.jpg`, `.png`, `.webp`)
4. Sync script uploaded it (check console output)
5. URL is in database (check Supabase table editor)

### Upload Failed

**Common causes:**
- File too large (>5MB)
- Invalid image format
- Supabase storage bucket doesn't exist
- Bucket permissions not set to public

**Fix:**
1. Check Supabase Storage > `covers` bucket exists
2. Verify bucket is public
3. Check file size and format
4. Re-run sync

### Wrong Image Uploaded

**Cause:** Filename mismatch

**Fix:**
1. Rename image to match audio file exactly
2. Delete old version from Supabase (Table Editor)
3. Re-run sync

## API / Database

### Query Version with Cover

```typescript
const { data } = await supabase
  .from('song_versions')
  .select('*, cover_url')
  .eq('id', versionId)
  .single()

// data.cover_url will be:
// - URL string if cover exists
// - null if no cover
```

### Check if Version Has Cover

```typescript
const hasCover = version.cover_url !== null
```

## Migration Path

### Already Have Content?

1. Run the migration SQL (adds `cover_url` column)
2. Add version covers to your local folders
3. Re-run sync with `--force` to update existing versions

**Note:** Sync script currently only adds new content. To update existing versions with covers, you'll need to delete and re-add them, or manually update the database.

## Future Enhancements

Potential additions:
- Fallback to album cover if no version cover
- Auto-generate version covers from album cover
- Bulk upload interface
- Cover art preview in sync diff
- Version cover in mini player

## Summary

✅ **Optional feature** - works without version covers  
✅ **Automatic detection** - just name files correctly  
✅ **Backward compatible** - existing content still works  
✅ **Suno-friendly** - perfect for AI-generated art  
✅ **Storage efficient** - uses same bucket as album covers  

Add version covers to make your music library more visual and engaging! 🎨
