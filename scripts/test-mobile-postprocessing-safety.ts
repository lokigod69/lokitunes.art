import * as fs from 'fs'
import * as path from 'path'

const componentPaths = [
  path.join(process.cwd(), 'components', 'OrbField.tsx'),
  path.join(process.cwd(), 'components', 'VersionOrbField.tsx'),
]

const failures = componentPaths.flatMap((componentPath) => {
  const source = fs.readFileSync(componentPath, 'utf8')
  const matches = [...source.matchAll(/<EffectComposer\b/g)]

  return matches
    .filter((match) => {
      const before = source.slice(Math.max(0, match.index - 80), match.index)
      return !before.includes('{!isMobile && (')
    })
    .map(() => path.relative(process.cwd(), componentPath))
})

if (failures.length > 0) {
  console.error('EffectComposer must stay inside explicit !isMobile render branches.')
  console.error('Postprocessing currently throws in mobile-sized browser sessions.')
  failures.forEach((componentPath) => console.error(`- ${componentPath}`))
  process.exit(1)
}

console.log('mobile postprocessing safety checks passed')
