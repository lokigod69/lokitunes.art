import assert from 'node:assert/strict'
import * as fs from 'fs'
import * as path from 'path'
import {
  getAlbumHref,
  getAlbumSlugCandidates,
  normalizeAlbumRouteSlug,
} from '../lib/album-slugs'

assert.equal(normalizeAlbumRouteSlug('Der%20Apotheker'), 'Der Apotheker')
assert.equal(normalizeAlbumRouteSlug('Der%2520Apotheker'), 'Der Apotheker')
assert.equal(normalizeAlbumRouteSlug('Lucian1'), 'Lucian1')
assert.equal(normalizeAlbumRouteSlug('Ratiboy'), 'Ratiboy')
assert.equal(normalizeAlbumRouteSlug('bad%slug'), 'bad%slug')

assert.deepEqual(getAlbumSlugCandidates('Der%20Apotheker'), ['Der Apotheker', 'Der%20Apotheker'])
assert.deepEqual(getAlbumSlugCandidates('Lucian1'), ['Lucian1'])

assert.equal(getAlbumHref('Der Apotheker'), '/album/Der%20Apotheker')
assert.equal(getAlbumHref('Lucian1'), '/album/Lucian1')
assert.equal(getAlbumHref('Ratiboy'), '/album/Ratiboy')

const filesWithAlbumNavigation = [
  path.join(process.cwd(), 'components', 'OrbFieldFallback.tsx'),
  path.join(process.cwd(), 'components', 'OrbField.tsx'),
  path.join(process.cwd(), 'components', 'GlobalAudioPlayer.tsx'),
  path.join(process.cwd(), 'components', 'MyRatingsModal.tsx'),
]

for (const filePath of filesWithAlbumNavigation) {
  const source = fs.readFileSync(filePath, 'utf8')
  assert.ok(
    source.includes('getAlbumHref'),
    `${path.relative(process.cwd(), filePath)} must route albums through getAlbumHref()`
  )
}

const querySource = fs.readFileSync(path.join(process.cwd(), 'lib', 'queries.ts'), 'utf8')
assert.ok(
  querySource.includes('getAlbumSlugCandidates'),
  'getAlbumBySlug must query decoded slug candidates so spaced slugs do not 404'
)

console.log('album slug routing checks passed')
