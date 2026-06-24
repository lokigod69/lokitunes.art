export type AlbumGridTextPosition = [number, number, number]

const CAMERA_FOV_DEGREES = 50
const DESKTOP_BASELINE_Y = -11
const MOBILE_BASELINE_Y = -10.25
const PLAYING_TEXT_Z = -8
const BOTTOM_PADDING = {
  desktop: 1.8,
  mobile: 1.4,
} as const

const HOVER_TEXT_SPOTS: Array<[number, number]> = [
  [-10, -8],
  [-8, -10],
  [-12, -10],
  [10, -8],
  [8, -10],
  [12, -10],
  [-4, -8],
  [0, -10],
  [4, -8],
  [-6, -12],
  [0, -12],
  [6, -12],
]

export interface AlbumGridTextLayout {
  playingPosition: AlbumGridTextPosition
  hoverPositions: AlbumGridTextPosition[]
  anchorY: 'bottom'
  fontSize: number
  maxWidth: number
  bottomPadding: number
  depthTest: false
  depthWrite: false
  renderOrder: number
}

interface AlbumGridTextLayoutOptions {
  cameraDistance: number
  isMobile?: boolean
}

interface FrustumOptions {
  fovDegrees?: number
  bottomPadding?: number
}

function getVerticalHalfHeightAtZ(
  cameraDistance: number,
  z: number,
  fovDegrees: number = CAMERA_FOV_DEGREES
): number {
  return Math.tan((fovDegrees * Math.PI) / 360) * Math.max(cameraDistance - z, 0)
}

function getSafeBaselineY(
  cameraDistance: number,
  z: number,
  isMobile: boolean,
  bottomPadding: number
): number {
  const desiredBaselineY = isMobile ? MOBILE_BASELINE_Y : DESKTOP_BASELINE_Y
  const visibleHalfHeight = getVerticalHalfHeightAtZ(cameraDistance, z)
  const lowestSafeBaselineY = -visibleHalfHeight + bottomPadding

  return Math.max(desiredBaselineY, lowestSafeBaselineY)
}

export function isAlbumGridTextBaselineVisible(
  position: AlbumGridTextPosition,
  cameraDistance: number,
  { fovDegrees = CAMERA_FOV_DEGREES, bottomPadding = 0 }: FrustumOptions = {}
): boolean {
  const [, y, z] = position
  const visibleHalfHeight = getVerticalHalfHeightAtZ(cameraDistance, z, fovDegrees)

  return y >= -visibleHalfHeight + bottomPadding && y <= visibleHalfHeight - bottomPadding
}

export function getAlbumGridTextLayout({
  cameraDistance,
  isMobile = false,
}: AlbumGridTextLayoutOptions): AlbumGridTextLayout {
  const bottomPadding = isMobile ? BOTTOM_PADDING.mobile : BOTTOM_PADDING.desktop
  const fontSize = isMobile ? 3.2 : 4
  const maxWidth = isMobile ? 28 : 40
  const playingBaselineY = getSafeBaselineY(
    cameraDistance,
    PLAYING_TEXT_Z,
    isMobile,
    bottomPadding
  )

  return {
    playingPosition: [0, playingBaselineY, PLAYING_TEXT_Z],
    hoverPositions: HOVER_TEXT_SPOTS.map(([x, z]) => [
      x,
      getSafeBaselineY(cameraDistance, z, isMobile, bottomPadding),
      z,
    ]),
    anchorY: 'bottom',
    fontSize,
    maxWidth,
    bottomPadding,
    depthTest: false,
    depthWrite: false,
    renderOrder: 20,
  }
}
