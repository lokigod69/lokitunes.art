# Content Workflow - Quick Reference

## One-Time Setup

1. **Set up Supabase** (if not done)
   - Run `supabase-schema.sql` in SQL Editor
   - Create `covers` and `audio` storage buckets (both public)
   - Get credentials and add to `.env.local`

2. **Install dependencies**
   ```bash
   pnpm install
   ```

## Adding Content (Every Time)

### Step 1: Prepare Files

Create a folder with your content:
```
~/my-music/
├── album-cover.jpg
├── song1-original.wav
├── song1-remix.wav
└── song2-original.wav
```

### Step 2: Upload to Supabase

```bash
pnpm upload-content ~/my-music
```

This creates `content-map.json` with file URLs.

### Step 3: Create Album Data

```bash
cp albums-to-add.example.json albums-to-add.json
```

Edit `albums-to-add.json`:
```json
[
  {
    "slug": "my-album",
    "title": "My Album",
    "cover_file": "album-cover.jpg",
    "songs": [
      {
        "title": "Song 1",
        "track_no": 1,
        "versions": [
          { "label": "Original", "audio_file": "song1-original.wav" },
          { "label": "Remix", "audio_file": "song1-remix.wav" }
        ]
      }
    ]
  }
]
```

### Step 4: Seed Database

```bash
pnpm seed-albums albums-to-add.json
```

### Step 5: View Site

Visit your deployed site - orbs should appear!

## Common Commands

```bash
# Upload new files (skips existing)
pnpm upload-content ~/path/to/content

# Seed database
pnpm seed-albums albums-to-add.json

# Run locally to test
pnpm dev

# Deploy (automatic on git push)
git push origin main
```

## File Requirements

**Images:**
- Formats: JPG, PNG, WebP, GIF
- Recommended: 1000x1000px
- Keep under 1MB

**Audio:**
- Formats: WAV, MP3, OGG, FLAC
- WAV recommended for quality
- Consider file sizes (Supabase free tier: 1GB total)

## Troubleshooting

**"content-map.json not found"**
→ Run `pnpm upload-content` first

**"Cover file not found"**
→ Check filename matches exactly (case-sensitive)

**"Album already exists"**
→ Use different slug or delete existing album in Supabase

**Files not uploading**
→ Check `.env.local` credentials and bucket permissions

## Tips

- Start with 1-2 albums to test
- Use consistent file naming (lowercase, hyphens)
- Keep original files backed up locally
- `content-map.json` and `albums-to-add.json` are gitignored
- Re-running upload skips existing files
- Re-running seed skips duplicate albums

## Full Documentation

See [ADDING_CONTENT.md](ADDING_CONTENT.md) for detailed guide.
