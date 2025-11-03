# Adding Content to Loki Tunes

This guide explains how to add albums, songs, and versions to your Loki Tunes site.

## Overview

Content is stored in Supabase (not in git). The workflow is:

1. **Prepare** your content files locally
2. **Upload** files to Supabase storage
3. **Seed** album data into the database
4. **View** your orbs appear on the site!

## Prerequisites

- Supabase project set up (see SETUP_GUIDE.md)
- `.env.local` configured with Supabase credentials
- Album cover images (JPG, PNG, WebP)
- Audio files (WAV, MP3, OGG, FLAC)

## Step 1: Organize Your Content

Create a local folder with your content files:

```
~/loki-tunes-content/
├── first-album.jpg          # Album cover
├── opening-original.wav     # Song version
├── opening-remix1.wav       # Song version
├── reflection-original.wav  # Song version
└── ...
```

**File naming tips:**
- Use descriptive, lowercase names with hyphens
- Keep names simple (they'll be referenced in JSON)
- Supported image formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- Supported audio formats: `.wav`, `.mp3`, `.ogg`, `.flac`

## Step 2: Upload Files to Supabase

Run the upload script:

```bash
pnpm upload-content ~/loki-tunes-content
```

**What it does:**
- Uploads images to Supabase `covers` bucket
- Uploads audio to Supabase `audio` bucket
- Skips files that already exist
- Creates `content-map.json` with file → URL mappings

**Example output:**
```
🎵 Loki Tunes Content Uploader

📁 Found 2 images and 5 audio files

📸 Uploading images to covers bucket...
   [1/2] first-album.jpg
   ✅ Uploaded: first-album.jpg
   [2/2] sonic-evolution.jpg
   ✅ Uploaded: sonic-evolution.jpg

🎵 Uploading audio to audio bucket...
   [1/5] opening-original.wav
   ✅ Uploaded: opening-original.wav
   ...

✅ Upload complete!
📝 Content map saved to: content-map.json
```

## Step 3: Create Album Data File

Copy the example file:

```bash
cp albums-to-add.example.json albums-to-add.json
```

Edit `albums-to-add.json` with your album information:

```json
[
  {
    "slug": "first-thoughts",
    "title": "First Thoughts",
    "cover_file": "first-album.jpg",
    "accent_hex": "#4F9EFF",
    "songs": [
      {
        "title": "Opening",
        "track_no": 1,
        "versions": [
          {
            "label": "Original",
            "audio_file": "opening-original.wav"
          },
          {
            "label": "Remix 1",
            "audio_file": "opening-remix1.wav"
          }
        ]
      }
    ]
  }
]
```

**Field explanations:**

- `slug`: URL-friendly identifier (lowercase, hyphens, unique)
- `title`: Display name for the album
- `cover_file`: Filename from your content folder (must match exactly)
- `accent_hex`: (Optional) Primary accent color, or leave blank for auto-extraction
- `songs`: Array of songs in the album
  - `title`: Song name
  - `track_no`: Track number (1, 2, 3...)
  - `versions`: Array of different versions/remixes
    - `label`: Version name ("Original", "Remix 1", "Stripped", etc.)
    - `audio_file`: Filename from your content folder (must match exactly)

## Step 4: Seed the Database

Run the seeder script:

```bash
pnpm seed-albums albums-to-add.json
```

**What it does:**
- Reads `content-map.json` to get Supabase URLs
- Extracts color palette from album covers
- Inserts albums, songs, and versions into database
- Shows progress for each item

**Example output:**
```
🎵 Loki Tunes Album Seeder

📚 Found 1 album(s) to seed

📀 Processing album: First Thoughts
   🎨 Extracting color palette...
   ✅ Created album: First Thoughts
   📝 Adding song: Opening
      ✅ Added version: Original
      ✅ Added version: Remix 1
   📝 Adding song: Reflection
      ✅ Added version: Original

✅ Seeding complete!
💡 Visit your site to see the new albums!
```

## Step 5: View Your Site

Visit your deployed site (e.g., `lokitunes.art`) and you should see:
- Orbs floating in the field (one per album)
- Orb size based on number of versions
- Click an orb to see the album page
- Play different versions of each song

## Adding More Content Later

To add more albums:

1. Add new files to your content folder
2. Run `pnpm upload-content ~/loki-tunes-content` (skips existing files)
3. Update `albums-to-add.json` with new albums
4. Run `pnpm seed-albums albums-to-add.json`

**Note:** The seeder will skip albums with duplicate slugs, so you can safely re-run it.

## Troubleshooting

### "content-map.json not found"

You need to run `pnpm upload-content` first before seeding.

### "Cover file not found in content map"

The `cover_file` in your JSON doesn't match any uploaded file. Check:
- Filename spelling (case-sensitive)
- File was actually uploaded (check `content-map.json`)

### "Audio file not found"

Same as above - check the `audio_file` names match exactly.

### "Album with slug already exists"

You're trying to add an album with a slug that's already in the database. Either:
- Use a different slug
- Delete the existing album from Supabase (Table Editor > albums)

### Files not uploading

Check:
- Supabase credentials in `.env.local` are correct
- Storage buckets `covers` and `audio` exist and are public
- File formats are supported

## File Size Considerations

**Images:**
- Recommended: 1000x1000px or smaller
- Keep under 1MB for fast loading

**Audio:**
- WAV files can be large (10-50MB per file)
- Consider MP3 for smaller sizes (but WAV is higher quality)
- Supabase free tier: 1GB storage total

## Managing Content

### View uploaded files

Go to Supabase Dashboard > Storage:
- `covers` bucket: All album artwork
- `audio` bucket: All audio files

### View database content

Go to Supabase Dashboard > Table Editor:
- `albums`: All albums
- `songs`: All songs
- `song_versions`: All versions

### Delete content

To remove an album:
1. Go to Table Editor > albums
2. Find the album row
3. Click delete (cascades to songs and versions)
4. Optionally delete files from Storage buckets

## Tips

- **Start small**: Add 1-2 albums first to test the workflow
- **Organize files**: Use consistent naming conventions
- **Backup**: Keep your original files safe locally
- **Test locally**: Run `pnpm dev` to test before deploying
- **Color palettes**: Auto-extraction works well, but you can override with `accent_hex`

## Example Workflow

```bash
# 1. Prepare content folder
mkdir ~/loki-tunes-content
# ... add your files ...

# 2. Upload to Supabase
pnpm upload-content ~/loki-tunes-content

# 3. Create album data
cp albums-to-add.example.json albums-to-add.json
# ... edit with your album info ...

# 4. Seed database
pnpm seed-albums albums-to-add.json

# 5. Visit your site!
```

## Need Help?

- Check `content-map.json` to see what was uploaded
- Review Supabase logs for errors
- Ensure `.env.local` has correct credentials
- See SETUP_GUIDE.md for Supabase configuration
