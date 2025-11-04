# Supabase Storage Bucket Setup

## Critical: Make Buckets Public

For album covers and version covers to load in the app, the Supabase storage buckets **must be publicly accessible**.

---

## Quick Fix (SQL Editor)

Run this in your **Supabase SQL Editor**:

```sql
-- Make covers bucket public
CREATE POLICY "Public Access to Covers" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'covers');

-- Make audio bucket public (for waveform previews)
CREATE POLICY "Public Access to Audio" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'audio');
```

---

## Manual Setup (Dashboard)

### 1. Go to Storage Settings

1. Open your Supabase project
2. Navigate to **Storage** in the left sidebar
3. Click on the **`covers`** bucket

### 2. Make Bucket Public

1. Click **Settings** (gear icon)
2. Toggle **"Public bucket"** to **ON**
3. Click **Save**

### 3. Repeat for Audio Bucket

1. Go back to Storage
2. Click on the **`audio`** bucket
3. Click **Settings**
4. Toggle **"Public bucket"** to **ON**
5. Click **Save**

---

## Verify Public Access

### Test Cover URL

1. Go to **Storage** → `covers` bucket
2. Click on any image file
3. Copy the **"Public URL"**
4. Paste it in a new browser tab
5. **Expected:** Image loads immediately
6. **If not:** Bucket isn't public yet

### Example Public URL

```
https://unbnzgpocplnquthioeu.supabase.co/storage/v1/object/public/covers/album-name/cover.jpg
```

Key parts:
- `public` in the URL path (not `authenticated`)
- No auth token required
- Opens directly in browser

---

## Troubleshooting

### CORS Errors in Console

**Error:**
```
Access to image at 'https://...supabase.co/storage/...' from origin 'https://lokitunes.art' 
has been blocked by CORS policy
```

**Solution:**
1. Go to **Storage** → `covers` bucket → **Settings**
2. Under **CORS Configuration**, add:
   ```json
   {
     "allowedOrigins": ["*"],
     "allowedMethods": ["GET"],
     "allowedHeaders": ["*"],
     "maxAge": 3600
   }
   ```
3. Click **Save**

### 404 Not Found

**Error:** Image URL returns 404

**Causes:**
1. Bucket isn't public
2. File doesn't exist
3. Wrong bucket name in URL

**Solution:**
1. Verify bucket is public (see above)
2. Check file exists in Storage dashboard
3. Verify URL matches: `storage/v1/object/public/covers/...`

### Authentication Required

**Error:** URL asks for authentication

**Cause:** Bucket is private

**Solution:**
1. Make bucket public (see above)
2. Or add RLS policy for SELECT

---

## File Size Limits

### Default Limits
- **Free tier:** 1GB total storage
- **Default file size:** 50MB per file

### Increase File Size Limit

For large WAV files:

1. Go to **Storage** → `audio` bucket → **Settings**
2. Find **"Maximum file size"**
3. Change from `50MB` to `500MB`
4. Click **Save**

**Note:** This only affects new uploads. Existing files are fine.

---

## Security Considerations

### Public Buckets Are Safe

Making buckets public is **safe** for:
- Album cover images
- Audio files
- Any content you want users to access

### What Stays Private

These remain protected:
- Database tables (controlled by RLS)
- User authentication data
- API keys
- Environment variables

### Read-Only Access

Public buckets only allow:
- ✅ **Reading** files (GET requests)
- ❌ **Not writing** (POST/PUT/DELETE blocked)

Only authenticated users with proper permissions can upload/delete.

---

## RLS Policies (Advanced)

If you want more control than "fully public":

### Allow Authenticated Uploads

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'covers' 
  AND auth.role() = 'authenticated'
);
```

### Allow Public Downloads Only

```sql
-- Public can only download, not upload
CREATE POLICY "Public Download Only" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'covers');
```

---

## Quick Checklist

Before deploying:

- [ ] `covers` bucket is public
- [ ] `audio` bucket is public
- [ ] Test a cover URL in browser (loads without auth)
- [ ] Test an audio URL in browser (loads without auth)
- [ ] CORS configured for your domain
- [ ] File size limit increased (if needed)
- [ ] No 404 or auth errors in browser console

---

## Common Mistakes

### ❌ Wrong: Private Bucket
```
https://...supabase.co/storage/v1/object/authenticated/covers/...
                                        ^^^^^^^^^^^^^^
```

### ✅ Correct: Public Bucket
```
https://...supabase.co/storage/v1/object/public/covers/...
                                        ^^^^^^
```

---

## Summary

1. **Make buckets public** via SQL or Dashboard
2. **Test URLs** in browser (should load immediately)
3. **Configure CORS** if needed
4. **Increase file size** for large audio files

**Result:** Album covers and audio load instantly in your app! 🎉
