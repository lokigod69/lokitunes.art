import * as fs from 'fs'
import * as path from 'path'

const hookPath = path.join(process.cwd(), 'hooks', 'useMobileDetection.ts')
const source = fs.readFileSync(hookPath, 'utf8')

if (!source.includes('return mounted ? isMobile : true')) {
  console.error('useMobileDetection must default to the mobile-safe path before mount')
  console.error('Returning desktop before matchMedia settles can mount fragile 3D effects on phones.')
  process.exit(1)
}

const useIsMobileStart = source.indexOf('export function useIsMobile')
const useIsMobileSource = useIsMobileStart >= 0 ? source.slice(useIsMobileStart) : ''

if (!useIsMobileSource.includes('const [isMobile, setIsMobile] = useState(true)')) {
  console.error('useIsMobile must initialize to the mobile-safe path.')
  console.error('Mobile-only guards can otherwise behave as desktop during the first tap.')
  process.exit(1)
}

if (!useIsMobileSource.includes('return isMobile')) {
  console.error('useIsMobile must default to the mobile-safe path before mount')
  console.error('Returning desktop before matchMedia settles can trigger desktop-only interaction gates.')
  process.exit(1)
}

console.log('mobile-safe default checks passed')
