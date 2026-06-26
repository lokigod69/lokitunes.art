import * as fs from 'fs'
import * as path from 'path'

const syncPath = path.join(process.cwd(), 'scripts', 'sync-content.ts')
const fallbackPath = path.join(process.cwd(), 'lib', 'supabase-images.ts')

const syncSource = fs.readFileSync(syncPath, 'utf8')
const fallbackSource = fs.readFileSync(fallbackPath, 'utf8')

const expectedExtensionOrder = "const IMAGE_EXTENSIONS = ['.webp', '.png', '.jpg', '.jpeg', '.gif']"

if (!syncSource.includes(expectedExtensionOrder)) {
  console.error('sync-content must define WebP-first image extension preference.')
  process.exit(1)
}

if (!syncSource.includes('findPreferredImageFile(files, [\'cover\'])')) {
  console.error('album cover scanning must use WebP-first preferred image lookup.')
  process.exit(1)
}

if (!syncSource.includes('findPreferredImageFile(files, [baseName])')) {
  console.error('version cover scanning must use WebP-first preferred image lookup.')
  process.exit(1)
}

if (syncSource.includes('const coverFileName = existingAlbumObject ||')) {
  console.error('cover refresh must not blindly reuse old album cover object names.')
  process.exit(1)
}

if (!syncSource.includes('getRefreshedAlbumCoverObjectName(existingAlbumObject, localAlbum)')) {
  console.error('cover refresh must migrate album cover object names to the local image extension.')
  process.exit(1)
}

if (!syncSource.includes('getRefreshedVersionCoverObjectName(existingVersionObject, slug, localVersion.coverPath)')) {
  console.error('cover refresh must migrate version cover object names to the local image extension.')
  process.exit(1)
}

if (!syncSource.includes('removeReplacedStorageObject(')) {
  console.error('cover refresh must remove old storage objects after migrating cover object names.')
  process.exit(1)
}

const firstWebpIndex = fallbackSource.indexOf('.webp')
const firstJpgIndex = fallbackSource.indexOf('.jpg')
const firstPngIndex = fallbackSource.indexOf('.png')

if (firstWebpIndex === -1 || firstJpgIndex === -1 || firstPngIndex === -1) {
  console.error('supabase image fallback URLs must include webp, jpg/jpeg, and png variants.')
  process.exit(1)
}

if (firstWebpIndex > firstJpgIndex || firstWebpIndex > firstPngIndex) {
  console.error('supabase image fallback URLs must prefer webp before jpeg/png.')
  process.exit(1)
}

console.log('webp image handling checks passed')
