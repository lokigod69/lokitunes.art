import * as fs from 'fs'
import * as path from 'path'

const layoutPath = path.join(process.cwd(), 'app', 'layout.tsx')
const layoutSource = fs.readFileSync(layoutPath, 'utf8')

if (layoutSource.includes('AuthInteractionGate')) {
  console.error('RootLayout must not mount AuthInteractionGate.')
  console.error('Signed-out users should be able to browse, play, and rate without a forced Google login.')
  process.exit(1)
}

const unifiedMenuPath = path.join(process.cwd(), 'components', 'UnifiedMenu.tsx')
const unifiedMenuSource = fs.readFileSync(unifiedMenuPath, 'utf8')

if (!unifiedMenuSource.includes('signInWithGoogle') || !unifiedMenuSource.includes('Sign In with Google')) {
  console.error('UnifiedMenu must keep Google sign-in available as an optional account action.')
  process.exit(1)
}

if (!unifiedMenuSource.includes('isAuthenticated &&') || !unifiedMenuSource.includes('Liked Songs')) {
  console.error('Liked Songs should remain visible only for authenticated users.')
  process.exit(1)
}

const ratingsRoutePath = path.join(process.cwd(), 'app', 'api', 'ratings', 'route.ts')
const ratingsRouteSource = fs.readFileSync(ratingsRoutePath, 'utf8')

if (!ratingsRouteSource.includes('ip_hash') || !ratingsRouteSource.includes('Could not determine client identity')) {
  console.error('Anonymous ratings must continue to use IP-hash identity when no Google profile exists.')
  process.exit(1)
}

console.log('mobile optional auth checks passed')
