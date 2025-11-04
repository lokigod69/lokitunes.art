-- Supabase Storage Permissions
-- Run this in Supabase SQL Editor to make storage buckets fully public

-- ============================================
-- COVERS BUCKET - Make fully public
-- ============================================

-- Delete any restrictive policies
DROP POLICY IF EXISTS "Public upload and read" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to Covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view covers" ON storage.objects;

-- Create simple public read policy for covers
CREATE POLICY "Anyone can view covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'covers');

-- Make sure covers bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'covers';

-- ============================================
-- AUDIO BUCKET - Make fully public
-- ============================================

-- Delete any restrictive policies
DROP POLICY IF EXISTS "Public Access to Audio" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view audio" ON storage.objects;

-- Create simple public read policy for audio
CREATE POLICY "Anyone can view audio"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audio');

-- Make sure audio bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'audio';

-- ============================================
-- VERIFY SETUP
-- ============================================

-- Check bucket settings
SELECT id, name, public 
FROM storage.buckets 
WHERE id IN ('covers', 'audio');

-- Expected output:
-- id      | name   | public
-- --------|--------|--------
-- covers  | covers | true
-- audio   | audio  | true

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%covers%' OR policyname LIKE '%audio%';

-- Expected output should show:
-- - "Anyone can view covers" policy for SELECT
-- - "Anyone can view audio" policy for SELECT

-- ============================================
-- TEST URLS
-- ============================================

-- Get a sample URL from covers bucket
SELECT 
  bucket_id,
  name,
  'https://unbnzgpocplnquthioeu.supabase.co/storage/v1/object/public/' || bucket_id || '/' || name as public_url
FROM storage.objects
WHERE bucket_id = 'covers'
LIMIT 1;

-- Copy the public_url and paste it in your browser
-- It should load the image immediately without authentication

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If images still don't load, check CORS settings:
-- Go to Supabase Dashboard → Storage → covers bucket → Settings → CORS
-- Ensure it allows GET requests from your domain

-- CORS configuration should be:
-- {
--   "allowedOrigins": ["*"],
--   "allowedMethods": ["GET"],
--   "allowedHeaders": ["*"],
--   "maxAge": 3600
-- }

-- ============================================
-- OPTIONAL: Allow authenticated uploads
-- ============================================

-- If you want authenticated users to upload files:

-- CREATE POLICY "Authenticated users can upload covers"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'covers');

-- CREATE POLICY "Authenticated users can upload audio"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'audio');

-- ============================================
-- NOTES
-- ============================================

-- Public buckets are safe for:
-- - Album cover images
-- - Audio files
-- - Any content you want users to access
--
-- What stays private:
-- - Database tables (controlled by RLS)
-- - User authentication data
-- - API keys
-- - Environment variables
--
-- Public buckets only allow:
-- - ✅ Reading files (GET requests)
-- - ❌ NOT writing (POST/PUT/DELETE blocked)
--
-- Only authenticated users with proper permissions can upload/delete.
