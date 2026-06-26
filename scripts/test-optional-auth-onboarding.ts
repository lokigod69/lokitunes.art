import assert from 'node:assert/strict'
import * as fs from 'fs'
import * as path from 'path'

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

const layoutSource = read(path.join('app', 'layout.tsx'))
assert.ok(
  !layoutSource.includes('AuthInteractionGate'),
  'RootLayout must not wrap the app in the forced Google auth interaction gate'
)

const menuSource = read(path.join('components', 'UnifiedMenu.tsx'))
assert.ok(
  menuSource.includes('signInWithGoogle') && menuSource.includes('Sign In with Google'),
  'UnifiedMenu must keep Google sign-in available as an optional account action'
)
assert.ok(
  menuSource.includes('isAuthenticated &&') && menuSource.includes('Liked Songs'),
  'Liked Songs should remain profile-only until anonymous likes have storage support'
)

const likesHookSource = read(path.join('hooks', 'useLikes.ts'))
assert.ok(
  likesHookSource.includes('if (!isAuthenticated || !accessToken) return false'),
  'Anonymous like toggles should fail closed instead of pretending to save browser-local likes'
)

const ratingsRouteSource = read(path.join('app', 'api', 'ratings', 'route.ts'))
assert.ok(
  ratingsRouteSource.includes('ip_hash') && ratingsRouteSource.includes('Could not determine client identity'),
  'Ratings must continue to support anonymous identity through an IP hash'
)
assert.ok(
  ratingsRouteSource.includes('interface RatingUpsertRow') &&
    ratingsRouteSource.includes('user_id: string | null') &&
    ratingsRouteSource.includes('ip_hash: string | null') &&
    !ratingsRouteSource.includes('...(userId'),
  'Ratings upsert payload should have one nullable row shape for Vercel TypeScript builds'
)

const onboardingHookSource = read(path.join('hooks', 'useOnboarding.ts'))
assert.ok(
  onboardingHookSource.includes('const shouldShow = forceShow') &&
    !onboardingHookSource.includes('forceShow || hasSeen === false'),
  'Onboarding should not auto-open for first-time visitors'
)

const pageSource = read(path.join('app', 'page.tsx'))
assert.ok(
  pageSource.includes('onOpenTutorial={show}') && pageSource.includes('<OnboardingModal'),
  'Home should keep the tutorial available from the menu'
)

console.log('optional auth and onboarding checks passed')
