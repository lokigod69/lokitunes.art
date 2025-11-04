# Content Sync Guide - True Bidirectional Sync

The easiest way to keep your local content in sync with Supabase.

## What's New: True Sync

The sync script now provides **true bidirectional synchronization**:

- ✅ **Detects additions** - New albums, songs, and versions
- ✅ **Detects deletions** - Content removed locally
- ✅ **Detects renames** - Track number or title changes
- ✅ **Safe by default** - Only adds/updates unless you use `--force`
- ✅ **Interactive diff** - Shows exactly what will change before applying
- ✅ **Confirmation prompt** - You approve changes before they happen

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

**Safe mode (default)** - Only adds and updates, no deletions:
```bash
pnpm sync-content D:\MUSIC\loki-content
```

**Force mode** - Includes deletions to mirror local content:
```bash
pnpm sync-content D:\MUSIC\loki-content --force
```

The script will:
1. 🔍 Scan your local content
2. 🗄️ Fetch current database state
3. 📊 Show you a diff of all changes
4. ❓ Ask for confirmation
5. 🔄 Apply the changes you approve

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

## Sync Modes

### Safe Mode (Default)

```bash
pnpm sync-content ~/loki-content
```

**What it does:**
- ✅ Adds new albums, songs, versions
- ✅ Updates song titles if renamed
- ⚠️ Warns about deletions but doesn't apply them

**Use when:** You want to add new content without risk of data loss.

### Force Mode

```bash
pnpm sync-content ~/loki-content --force
```

**What it does:**
- ✅ Adds new albums, songs, versions
- ✅ Updates song titles if renamed
- 🗑️ Deletes albums/songs/versions removed locally

**Use when:** You want to mirror your local content exactly to the database.

**⚠️ Warning:** This will permanently delete content from Supabase that doesn't exist locally!

## One-Click Sync (Recommended)

### Windows

1. Copy `sync.bat.example` to your content folder
2. Rename to `sync.bat`
3. Edit paths in the file:
   ```batch
   cd /d "D:\CODING\LOKI LAZER\lokitunes"
   call pnpm sync-content "%~dp0"
   ```
4. Double-click `sync.bat` to sync (safe mode)
5. Or run `sync.bat --force` for force mode

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

### First Sync (Adding Content)

```
🎵 Loki Tunes Content Sync
Mode: 🛡️  SAFE (add/update only)

📁 Scanning local content...
   Found 2 valid album(s) locally

🗄️  Fetching database state...
   Found 0 album(s) in database

🔍 Detecting changes...

📊 Changes detected:

✓ 2 new album(s) to add:
   • First Thoughts
   • Midnight Sessions

✓ 3 new song(s) to add:
   • Opening (First Thoughts)
   • Reflection (First Thoughts)
   • Dreams (Midnight Sessions)

✓ 4 new version(s) to add:
   • Opening - Original
   • Opening - Remix 1
   • Reflection - Original
   • Dreams - Original

Continue with sync? (y/n): y

🔄 Applying changes...

➕ Adding 2 new album(s)...
   ✅ Added album First Thoughts
   ✅ Added song Opening
   ✅ Added version Opening - Original
   ✅ Added version Opening - Remix 1
   ✅ Added song Reflection
   ✅ Added version Reflection - Original
   ✅ Added album Midnight Sessions
   ✅ Added song Dreams
   ✅ Added version Dreams - Original

✅ Sync complete!

💡 Visit your site to see the changes!
```

### Subsequent Sync (Detecting Changes)

```
🎵 Loki Tunes Content Sync
Mode: 🛡️  SAFE (add/update only)

📁 Scanning local content...
   Found 1 valid album(s) locally

🗄️  Fetching database state...
   Found 2 album(s) in database

🔍 Detecting changes...

📊 Changes detected:

✓ 1 new song(s) to add:
   • Awakening (First Thoughts)

✗ 1 album(s) to delete (removed locally):
   • Midnight Sessions

⚠ 1 song(s) renamed:
   • "Opening" → "The Opening" (First Thoughts)

⚠️  Destructive changes detected but not in --force mode.
   Run with --force to apply deletions.

Continue with sync? (y/n): y

🔄 Applying changes...

⚠️  Skipping 1 album deletion(s) (use --force to delete)

✏️  Updating 1 song(s)...
   ✅ Renamed "Opening" → "The Opening"

➕ Adding 1 new song(s)...
   ✅ Added song Awakening
   ✅ Added version Awakening - Original

✅ Sync complete!

💡 Visit your site to see the changes!
```

### Force Mode (With Deletions)

```
🎵 Loki Tunes Content Sync
Mode: 🔥 FORCE (will delete)

📊 Changes detected:

✗ 1 album(s) to delete (removed locally):
   • Midnight Sessions

Continue with sync? (y/n): y

🔄 Applying changes...

🗑️  Deleting 1 album(s)...
   ✅ Deleted Midnight Sessions

✅ Sync complete!
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

### Already in Sync

```
📊 Changes detected:

✅ Everything is in sync! No changes needed.

💡 Everything is already in sync!
```

This means your local content matches the database perfectly - no action needed!

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
