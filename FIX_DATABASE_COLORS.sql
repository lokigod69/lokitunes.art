-- ============================================
-- FIX PALETTE COLORS IN DATABASE
-- Strip alpha channel from all palette colors
-- THREE.js requires 6-char hex, not 8-char
-- ============================================

-- STEP 1: Check which albums have 8-char colors
SELECT 
  id,
  slug,
  title,
  palette->>'dominant' as dominant,
  palette->>'accent1' as accent1,
  palette->>'accent2' as accent2,
  length(palette->>'dominant') as dominant_length,
  length(palette->>'accent1') as accent1_length,
  length(palette->>'accent2') as accent2_length
FROM albums
WHERE 
  length(palette->>'dominant') > 7 OR
  length(palette->>'accent1') > 7 OR
  length(palette->>'accent2') > 7;

-- Expected: Shows albums like Platypus with 8-char colors

-- STEP 2: Preview the fix (no changes made)
SELECT 
  id,
  slug,
  title,
  palette->>'dominant' as old_dominant,
  substring(palette->>'dominant', 1, 7) as new_dominant,
  palette->>'accent1' as old_accent1,
  substring(palette->>'accent1', 1, 7) as new_accent1,
  palette->>'accent2' as old_accent2,
  substring(palette->>'accent2', 1, 7) as new_accent2
FROM albums
WHERE 
  length(palette->>'dominant') > 7 OR
  length(palette->>'accent1') > 7 OR
  length(palette->>'accent2') > 7;

-- Expected: Shows before/after comparison

-- STEP 3: Apply the fix (CAREFUL - this modifies data!)
UPDATE albums 
SET palette = jsonb_set(
  jsonb_set(
    jsonb_set(
      palette,
      '{dominant}',
      to_jsonb(substring(palette->>'dominant', 1, 7))
    ),
    '{accent1}',
    to_jsonb(substring(palette->>'accent1', 1, 7))
  ),
  '{accent2}',
  to_jsonb(substring(palette->>'accent2', 1, 7))
)
WHERE 
  length(palette->>'dominant') > 7 OR
  length(palette->>'accent1') > 7 OR
  length(palette->>'accent2') > 7;

-- Expected: Returns number of albums updated

-- STEP 4: Verify the fix
SELECT 
  id,
  slug,
  title,
  palette->>'dominant' as dominant,
  palette->>'accent1' as accent1,
  palette->>'accent2' as accent2,
  length(palette->>'dominant') as dominant_length,
  length(palette->>'accent1') as accent1_length,
  length(palette->>'accent2') as accent2_length
FROM albums
ORDER BY slug;

-- Expected: All colors should be 7 characters or less (#RRGGBB)

-- ============================================
-- NOTES:
-- - Run STEP 1 and STEP 2 first to preview
-- - STEP 3 permanently modifies database
-- - STEP 4 confirms all colors are fixed
-- - After running, no code changes needed!
-- ============================================
