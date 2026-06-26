import * as fs from 'fs'
import * as path from 'path'

const albumRoutePath = path.join(process.cwd(), 'app', 'album', '[slug]', 'page.tsx')
const source = fs.readFileSync(albumRoutePath, 'utf8')

const requiredSnippets = [
  "export const dynamic = 'force-dynamic'",
  'export const revalidate = 0',
  "export const fetchCache = 'force-no-store'",
]

const missing = requiredSnippets.filter((snippet) => !source.includes(snippet))

if (missing.length > 0) {
  console.error('album route can cache newly-uploaded or previously-missing slugs')
  console.error('missing freshness exports:')
  for (const snippet of missing) {
    console.error(`- ${snippet}`)
  }
  process.exit(1)
}

console.log('album route freshness checks passed')
