# Content Sync Guide - One Command Upload

The easiest way to add content to Loki Tunes.

## Quick Start

### 1. Organize Your Content

Create folders for each album:

```
D:\MUSIC\loki-content\
├── first-thoughts\
│   ├── cover.jpg                    ← Required: Album cover
│   ├── 01-opening-original.wav      ← Track 1, "Opening", version "Original"
│   ├── 01-opening-remix1.wav        ← Track 1, "Opening", version "Remix 1"
│   └── 02-reflection-original.wav   ← Track 2, "Reflection", version "Original"
│
└── midnight-sessions\
    ├── cover.png                    ← Required: Album cover
    └── 01-dreams.wav                ← Track 1, "Dreams", version "Original"
```

**Rules:**
- Each folder = one album
- Folder name = album slug (lowercase, hyphens)
- Must have `cover.jpg` or `cover.png`
- Must have at least one audio file

### 2. Run Sync Command

```bash
pnpm sync-content D:\MUSIC\loki-content
```

That's it! The script will:
- ✅ Upload all covers and audio to Supabase
- ✅ Extract color palettes from covers
- ✅ Create albums, songs, and versions in database
- ✅ Show progress and summary

### 3. View Your Site

Visit your deployed site - orbs appear automatically!

## Filename Patterns

The script auto-detects track numbers, song names, and versions:

| Filename | Track # | Song Title | Version |
|----------|---------|------------|---------|
| `01-opening-original.wav` | 1 | Opening | Original |
| `01-opening-remix1.wav` | 1 | Opening | Remix 1 |
| `02-reflection.wav` | 2 | Reflection | Original |
| `standalone-song.wav` | 1 | Standalone Song | Original |
| `track-acoustic.wav` | 1 | Track | Acoustic |

**Pattern:** `[number]-[song-name]-[version].wav`

- Number is optional (defaults to 1)
- Version is optional (defaults to "Original")
- Use hyphens to separate words
- Script prettifies names automatically

**Recognized versions:**
- `original` → "Original"
- `remix1`, `remix2` → "Remix 1", "Remix 2"
- `stripped` → "Stripped"
- `acoustic` → "Acoustic"
- `extended` → "Extended"
- `instrumental` → "Instrumental"

## One-Click Sync (Recommended)

### Windows

1. Copy `sync.bat.example` to your content folder
2. Rename to `sync.bat`
3. Edit paths in the file:
   ```batch
   cd /d "D:\CODING\LOKI LAZER\lokitunes"
   call pnpm sync-content "%~dp0"
   ```
4. Double-click `sync.bat` to sync!

### Mac/Linux

1. Copy `sync.sh.example` to your content folder
2. Rename to `sync.sh`
3. Make executable: `chmod +x sync.sh`
4. Edit paths in the file:
   ```bash
   cd ~/code/lokitunes
   pnpm sync-content "$SCRIPT_DIR"
   ```
5. Double-click (or run `./sync.sh`) to sync!

## Example Output

```
🎵 Loki Tunes Content Sync

📁 Found 2 album folder(s)

📀 First Thoughts
   🎨 Extracting color palette...
   ✅ 2 song(s), 3 version(s) uploaded
   🎨 Palette: #4F9EFF, #2D3748, #E8D5B5

📀 Midnight Sessions
   🎨 Extracting color palette...
   ✅ 1 song(s), 1 version(s) uploaded
   🎨 Palette: #8B5CF6, #1F2937, #F3E8FF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Successfully added 2 album(s):
   • First Thoughts (2 songs, 3 versions)
   • Midnight Sessions (1 songs, 1 versions)

💡 Visit your site to see the new orbs!
```

## Error Handling

### Missing Cover

```
📀 Broken Album
   ❌ No cover image found (need cover.jpg or cover.png)
```

**Fix:** Add `cover.jpg` or `cover.png` to the folder

### No Audio Files

```
📀 Empty Album
   ❌ No audio files found
```

**Fix:** Add at least one `.wav`, `.mp3`, `.ogg`, or `.flac` file

### Duplicate Album

```
📀 First Thoughts
   ⏭️  Album already exists, skipping...
```

**Fix:** Either:
- Delete the existing album in Supabase (Table Editor > albums)
- Rename the folder to a different slug

## Supported Formats

**Images:**
- JPG, JPEG, PNG, GIF, WebP
- Recommended: 1000x1000px, under 1MB

**Audio:**
- WAV, MP3, OGG, FLAC
- WAV recommended for quality
- Consider file sizes (Supabase free tier: 1GB total)

## Tips

✅ **Start small** - Test with 1 album first  
✅ **Use consistent naming** - Lowercase, hyphens, descriptive  
✅ **Keep originals** - Don't delete your source files  
✅ **Re-run safely** - Script skips existing files and albums  
✅ **Check output** - Read the summary to catch errors  

## Troubleshooting

### "Missing Supabase credentials"

Add to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### "No album folders found"

Check your folder structure:
```
content-folder/
├── album-1/          ← Each album in its own folder
│   └── cover.jpg
└── album-2/
    └── cover.png
```

### Files not uploading

- Check Supabase credentials
- Verify storage buckets exist (`covers` and `audio`)
- Ensure buckets are set to public

### Album not appearing on site

- Check Supabase Table Editor > albums (should see your album)
- Verify `is_public` is `true`
- Clear browser cache and refresh

## Comparison: Old vs New Workflow

### Old Way (3 steps)
```bash
pnpm upload-content ~/content
# Edit albums-to-add.json manually
pnpm seed-albums albums-to-add.json
```

### New Way (1 step)
```bash
pnpm sync-content ~/content
```

Or just double-click `sync.bat`! 🎉

## Advanced: Batch Operations

Add multiple albums at once:

```
loki-content/
├── album-1/
│   ├── cover.jpg
│   └── 01-song.wav
├── album-2/
│   ├── cover.jpg
│   └── 01-track.wav
├── album-3/
│   ├── cover.png
│   └── 01-tune.wav
└── sync.bat          ← Syncs all 3 albums
```

Run once, all albums upload!

## Need Help?

- Check the summary output for specific errors
- Verify folder structure matches examples
- See SETUP_GUIDE.md for Supabase configuration
- Old scripts still available: `upload-content` and `seed-albums`
