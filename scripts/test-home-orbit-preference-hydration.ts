import * as fs from 'fs'
import * as path from 'path'

const pagePath = path.join(process.cwd(), 'app', 'page.tsx')
const source = fs.readFileSync(pagePath, 'utf8')

const stateInitializerReadsPreference = /useState\s*\(\s*\(\s*\)\s*=>[\s\S]*?loadOrbitModePreference\s*\(/.test(source)
const hasMountedPreferenceEffect = /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?setIs3D\s*\(\s*loadOrbitModePreference\s*\(\s*\)\s*\)/.test(source)

if (stateInitializerReadsPreference) {
  console.error('Home must not read the saved orbit preference during the initial state render.')
  console.error('Doing so can choose a different tree from the server render when mobile defaults are active.')
  process.exit(1)
}

if (!source.includes('const [is3D, setIs3D] = useState(false)') || !hasMountedPreferenceEffect) {
  console.error('Home should start in the hydration-safe 2D state and load orbit preference after mount.')
  process.exit(1)
}

console.log('home orbit preference hydration checks passed')
