# Quick Start Guide

Get Loki Tunes running in 5 minutes (assuming you have Supabase set up).

## 1. Install Dependencies

```bash
pnpm install
```

## 2. Set Up Environment

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Set Up Supabase

### Run Schema

Copy `supabase-schema.sql` → Supabase SQL Editor → Run

### Create Storage Buckets

1. Supabase Dashboard → Storage
2. Create `covers` bucket (public)
3. Create `audio` bucket (public)

## 4. Add Sample Data

### Upload Files

1. Upload album cover to `covers` bucket
2. Upload audio file to `audio` bucket

### Insert Data

In Supabase Table Editor:

**albums table:**
```
slug: test-album
title: Test Album
cover_url: https://xxxxx.supabase.co/storage/v1/object/public/covers/your-image.jpg
is_public: true
```

**songs table:**
```
album_id: [select the album]
title: Test Song
track_no: 1
```

**song_versions table:**
```
song_id: [select the song]
label: Original
audio_url: https://xxxxx.supabase.co/storage/v1/object/public/audio/your-audio.wav
```

## 5. Run

```bash
pnpm dev
```

Open http://localhost:3000

## Troubleshooting

**No orbs showing?**
- Check browser console
- Verify `.env.local` credentials
- Ensure `is_public = true` in albums table

**Audio not playing?**
- Open audio URL directly in browser to test
- Check file format (WAV recommended)
- Verify storage bucket is public

**Need more help?**
See `SETUP_GUIDE.md` for detailed instructions.
