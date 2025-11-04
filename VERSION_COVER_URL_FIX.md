# Version Cover URL Path Fix

## ✅ FIXED - November 5, 2025, 4:22 AM

**Commit:** `795f6e5`  
**Message:** "FIX: Version cover URLs now include album folder path"  
**Status:** ✅ Successfully pushed to GitHub

```
To https://github.com/lokigod69/lokitunes.art.git
   76fa69d..795f6e5  main -> main
```

---

## 🐛 The Problem

**Storage Structure:**
```
covers/
  Platypus/
    cover.jpg
    01-platypus-original.jpg
    02-platypus-remix.jpg
```

**Database URLs (WRONG):**
```
https://...supabase.co/storage/v1/object/public/covers/01-platypus-original.jpg ❌
https://...supabase.co/storage/v1/object/public/covers/02-platypus-remix.jpg ❌
```

**Should Be:**
```
https://...supabase.co/storage/v1/object/public/covers/Platypus/01-platypus-original.jpg ✅
https://...supabase.co/storage/v1/object/public/covers/Platypus/02-platypus-remix.jpg ✅
```

---

## 🔧 Root Cause

The `uploadFile()` function in `scripts/sync-content.ts` had two issues:

### Issue 1: File Existence Check
```typescript
// WRONG - Searches in root directory
const { data: existingFiles } = await supabase.storage
  .from(bucket)
  .list('', { search: fileName })  // Empty string = root
```

When `fileName = "Platypus/01-platypus-original.jpg"`, it searched the root directory instead of the `Platypus/` folder.

### Issue 2: URL Construction
The function was correctly uploading to the folder path, but the existence check was failing, causing duplicate upload attempts or incorrect URL returns.

---

## ✅ The Fix

### Updated `uploadFile()` Function

```typescript
async function uploadFile(bucket: string, filePath: string, fileName: string): Promise<string | null> {
  try {
    const fileBuffer = fs.readFileSync(filePath)
    
    // Check if file already exists
    // For files in folders (e.g., "Platypus/cover.jpg"), we need to check the folder
    const folderPath = fileName.includes('/') ? fileName.substring(0, fileName.lastIndexOf('/')) : ''
    const { data: existingFiles } = await supabase.storage
      .from(bucket)
      .list(folderPath, { search: path.basename(fileName) })
    
    if (existingFiles && existingFiles.length > 0) {
      // File exists, return its public URL with full path
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
      return data.publicUrl
    }

    // Upload new file with full path (including folder)
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: getContentType(fileName),
        upsert: false,
      })

    if (error) {
      console.error(`      ❌ Failed to upload ${fileName}:`, error.message)
      return null
    }

    // Return public URL with full path (data.path includes the folder)
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
    return urlData.publicUrl
  } catch (error) {
    console.error(`      ❌ Error uploading ${fileName}:`, error)
    return null
  }
}
```

### Key Changes

1. **Extract folder path:**
   ```typescript
   const folderPath = fileName.includes('/') 
     ? fileName.substring(0, fileName.lastIndexOf('/')) 
     : ''
   ```

2. **Search in correct folder:**
   ```typescript
   .list(folderPath, { search: path.basename(fileName) })
   ```

3. **Return full path URL:**
   ```typescript
   supabase.storage.from(bucket).getPublicUrl(fileName)  // Includes folder
   ```

---

## 📊 How It Works Now

### Example: Uploading Version Cover

**Input:**
- `bucket`: `'covers'`
- `filePath`: `'D:/Music/Platypus/01-platypus-original.jpg'`
- `fileName`: `'Platypus/01-platypus-original.jpg'`

**Process:**
1. Extract folder: `folderPath = 'Platypus'`
2. Check existence: `list('Platypus', { search: '01-platypus-original.jpg' })`
3. If exists: Return `getPublicUrl('Platypus/01-platypus-original.jpg')`
4. If not: Upload to `'Platypus/01-platypus-original.jpg'`
5. Return URL: `https://...supabase.co/storage/v1/object/public/covers/Platypus/01-platypus-original.jpg`

**Database:**
```sql
INSERT INTO song_versions (cover_url) 
VALUES ('https://...supabase.co/storage/v1/object/public/covers/Platypus/01-platypus-original.jpg')
```

---

## 🧪 Testing Instructions

### 1. Re-sync Content

Run the sync script to update URLs:

```bash
# Windows
sync-force.bat

# Or manually
pnpm tsx scripts/sync-content.ts --force
```

This will:
- Delete existing database entries
- Re-upload files (or detect existing ones)
- Store correct URLs with folder paths

### 2. Verify Storage Structure

In **Supabase Storage** → `covers` bucket:

```
covers/
  Platypus/
    cover.jpg
    01-platypus-original.jpg
    02-platypus-remix.jpg
  AnotherAlbum/
    cover.jpg
    01-song-original.jpg
```

### 3. Verify Database URLs

In **Supabase SQL Editor**:

```sql
SELECT 
  sv.label,
  sv.cover_url,
  s.title,
  a.title as album
FROM song_versions sv
JOIN songs s ON sv.song_id = s.id
JOIN albums a ON s.album_id = a.id
WHERE sv.cover_url IS NOT NULL
ORDER BY a.title, s.track_no, sv.label;
```

**Expected Output:**
```
label     | cover_url                                                                  | title     | album
----------|---------------------------------------------------------------------------|-----------|----------
Original  | https://...supabase.co/storage/v1/object/public/covers/Platypus/01-...jpg | Platypus  | Platypus
Remix     | https://...supabase.co/storage/v1/object/public/covers/Platypus/02-...jpg | Platypus  | Platypus
```

**Check:** URLs should include album folder name!

### 4. Test in Browser

Copy a `cover_url` from the database and paste it in your browser.

**Expected:** Image loads immediately  
**If 404:** URL is missing folder path (old bug)

### 5. Test in App

1. Hard refresh: `Ctrl + Shift + R`
2. Navigate to an album page
3. Expand a song with multiple versions
4. **Expected:** Version cover thumbnails appear
5. **Check console:** No 404 errors

---

## 🔍 Before vs After

### Before (Broken)

**Sync Script Output:**
```
✅ Added version Platypus - Original
   🎨 Uploaded version cover for Original
```

**Database:**
```
cover_url: https://...supabase.co/storage/v1/object/public/covers/01-platypus-original.jpg
```

**Storage:**
```
covers/Platypus/01-platypus-original.jpg  ← File is here
```

**Result:** 404 error (URL doesn't match storage path)

---

### After (Fixed)

**Sync Script Output:**
```
✅ Added version Platypus - Original
   🎨 Uploaded version cover for Original
```

**Database:**
```
cover_url: https://...supabase.co/storage/v1/object/public/covers/Platypus/01-platypus-original.jpg
```

**Storage:**
```
covers/Platypus/01-platypus-original.jpg  ← File is here
```

**Result:** ✅ Image loads correctly!

---

## 📝 Files Changed

### `scripts/sync-content.ts`

**Function:** `uploadFile()`

**Lines Modified:** 189-226

**Changes:**
- Extract folder path from `fileName`
- Search in correct folder for existing files
- Return URLs with full path (including folder)
- Added comments explaining folder handling

---

## ⚠️ Important Notes

### Re-sync Required

After this fix, you **must re-sync** your content to update the database URLs:

```bash
sync-force.bat
```

This will:
1. Delete all albums, songs, and versions
2. Re-scan your local music folder
3. Upload files (or detect existing ones)
4. Store correct URLs with folder paths

### Existing Files in Storage

The fix doesn't move files in storage. If you already have:
```
covers/Platypus/01-platypus-original.jpg
```

The sync script will:
1. Detect it exists
2. Return the correct URL with folder path
3. Store that URL in the database

**No duplicate uploads!**

### Album Covers

Album covers were already working correctly:
```typescript
const coverFileName = `${album.slug}${path.extname(album.coverPath)}`
```

This stores them in the root:
```
covers/platypus.jpg  ← Album cover (root level)
covers/Platypus/01-platypus-original.jpg  ← Version cover (in folder)
```

---

## 🎯 Success Criteria

After re-sync:

- ✅ Version cover URLs include album folder
- ✅ URLs match actual storage paths
- ✅ No 404 errors in browser
- ✅ Thumbnails appear in app
- ✅ Console shows successful loads
- ✅ No duplicate files in storage

---

## 🚀 Next Steps

1. **Push to GitHub:** ✅ Done (`795f6e5`)
2. **Wait for deployment:** 2-3 minutes
3. **Run sync script:** `sync-force.bat`
4. **Verify database:** Check URLs include folder
5. **Test in app:** Hard refresh and check thumbnails

---

## 📚 Related Files

- **`scripts/sync-content.ts`** - Fixed upload function
- **`SUPABASE_BUCKET_SETUP.md`** - Storage permissions
- **`VERSION_COVERS_GUIDE.md`** - Feature documentation
- **`SYNC_GUIDE.md`** - How to organize files

---

**Status:** ✅ Fix deployed! Re-sync required to update database URLs.  
**Commit:** `795f6e5`  
**Time:** November 5, 2025, 4:22 AM UTC+8
