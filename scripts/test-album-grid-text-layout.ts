import assert from 'node:assert/strict'
import {
  getAlbumGridTextLayout,
  isAlbumGridTextBaselineVisible,
} from '../lib/album-grid-text-layout'
import { calculateCameraDistance } from '../lib/orb-layout'

function getSceneCameraDistance(versionCount: number, isMobile: boolean, aspectRatio: number): number {
  const baseCameraDistance = calculateCameraDistance(versionCount, isMobile, aspectRatio)
  const minSmallCountDistance = versionCount === 1
    ? (isMobile ? 54 : 56)
    : (isMobile ? 44 : 44)

  return versionCount <= 2
    ? Math.max(baseCameraDistance, minSmallCountDistance)
    : baseCameraDistance
}

for (const scenario of [
  { label: 'desktop', isMobile: false, aspectRatio: 16 / 9 },
  { label: 'mobile', isMobile: true, aspectRatio: 390 / 844 },
]) {
  for (let versionCount = 1; versionCount <= 10; versionCount += 1) {
    const cameraDistance = getSceneCameraDistance(
      versionCount,
      scenario.isMobile,
      scenario.aspectRatio
    )
    const layout = getAlbumGridTextLayout({
      cameraDistance,
      isMobile: scenario.isMobile,
    })

    assert.equal(
      layout.anchorY,
      'bottom',
      `${scenario.label} ${versionCount} version(s): title must grow upward from a protected baseline`
    )

    assert.equal(
      layout.depthTest,
      false,
      `${scenario.label} ${versionCount} version(s): title should not be depth-masked by grid orbs`
    )

    assert.ok(
      layout.playingPosition[2] < 0,
      `${scenario.label} ${versionCount} version(s): playing title should sit back in the grid volume, not at the camera edge`
    )

    assert.ok(
      isAlbumGridTextBaselineVisible(layout.playingPosition, cameraDistance, {
        bottomPadding: layout.bottomPadding,
      }),
      `${scenario.label} ${versionCount} version(s): playing title baseline should be inside the camera frustum`
    )

    for (const hoverPosition of layout.hoverPositions) {
      assert.ok(
        isAlbumGridTextBaselineVisible(hoverPosition, cameraDistance, {
          bottomPadding: layout.bottomPadding,
        }),
        `${scenario.label} ${versionCount} version(s): hover title baseline should be inside the camera frustum`
      )
    }
  }
}

console.log('album grid text layout checks passed')
