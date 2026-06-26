import * as fs from 'fs'
import * as path from 'path'

const syncPath = path.join(process.cwd(), 'scripts', 'sync-content.ts')
const batchExamplePath = path.join(process.cwd(), 'sync.bat.example')
const source = fs.readFileSync(syncPath, 'utf8')
const batchExample = fs.readFileSync(batchExamplePath, 'utf8')

const databaseFailurePattern = /catch \(err\) \{[\s\S]*?Refusing to continue[\s\S]*?process\.exitCode = 1[\s\S]*?return\s*\}/

if (!databaseFailurePattern.test(source)) {
  console.error('sync-content must exit nonzero when database state cannot be fetched.')
  console.error('Otherwise sync.bat can print success after a failed upload/sync.')
  process.exit(1)
}

const cancellationPattern = /if \(answer !== 'y' && answer !== 'yes'\) \{[\s\S]*?Sync cancelled[\s\S]*?process\.exitCode = 1[\s\S]*?return\s*\}/

if (!cancellationPattern.test(source)) {
  console.error('sync-content must exit nonzero when a sync is cancelled.')
  console.error('Otherwise sync.bat can print success after no changes were applied.')
  process.exit(1)
}

const callIndex = batchExample.indexOf('call pnpm sync-content')
const errorlevelIndex = batchExample.toLowerCase().indexOf('if errorlevel 1')
const successIndex = batchExample.toLowerCase().indexOf('sync complete!')

if (callIndex === -1 || errorlevelIndex === -1 || successIndex === -1 || !(callIndex < errorlevelIndex && errorlevelIndex < successIndex)) {
  console.error('sync.bat.example must check errorlevel before printing sync success.')
  process.exit(1)
}

console.log('sync failure exit-code checks passed')
