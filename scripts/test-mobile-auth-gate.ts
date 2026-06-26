import * as fs from 'fs'
import * as path from 'path'

const gatePath = path.join(process.cwd(), 'components', 'AuthInteractionGate.tsx')
const source = fs.readFileSync(gatePath, 'utf8')

if (!source.includes("closest?.('[data-auth-gate-mobile-browse=\"true\"]')")) {
  console.error('AuthInteractionGate must allow explicit mobile browse/menu surfaces through the gate.')
  console.error('Without this, signed-out mobile users can be blocked from menus and album navigation.')
  process.exit(1)
}

if (!source.includes('onClickCapture={triggerGate}')) {
  console.error('AuthInteractionGate should keep click capture active so protected mobile interactions stay gated.')
  process.exit(1)
}

if (source.includes('onClickCapture: triggerGate')) {
  console.error('AuthInteractionGate should not disable click capture wholesale on mobile.')
  process.exit(1)
}

if (!source.includes('onPointerDownCapture: triggerGate')) {
  console.error('AuthInteractionGate should keep desktop pointer capture inside the non-mobile branch.')
  process.exit(1)
}

const requiredBrowseSurfaces = [
  path.join(process.cwd(), 'app', 'page.tsx'),
  path.join(process.cwd(), 'app', 'album', '[slug]', 'AlbumPage.tsx'),
  path.join(process.cwd(), 'components', 'OrbFieldFallback.tsx'),
  path.join(process.cwd(), 'components', 'OnboardingModal.tsx'),
  path.join(process.cwd(), 'components', 'UnifiedMenu.tsx'),
]

for (const browsePath of requiredBrowseSurfaces) {
  const browseSource = fs.readFileSync(browsePath, 'utf8')
  if (!browseSource.includes('data-auth-gate-mobile-browse="true"')) {
    console.error(`${path.relative(process.cwd(), browsePath)} must mark mobile browse/menu controls as auth-gate-safe.`)
    process.exit(1)
  }
}

console.log('mobile auth gate checks passed')
