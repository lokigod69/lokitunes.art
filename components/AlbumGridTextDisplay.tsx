'use client'

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import type { Album } from '@/lib/supabase'
import type { ExtendedVersion } from './VersionOrb'
import { getAlbumGridTextLayout } from '@/lib/album-grid-text-layout'

function getStableHoverSpotIndex(versionId: string, spotCount: number): number {
  let hash = 0
  for (let i = 0; i < versionId.length; i += 1) {
    hash = (hash * 31 + versionId.charCodeAt(i)) >>> 0
  }
  return hash % spotCount
}

function applyTextLayerMaterial(
  mesh: THREE.Mesh,
  renderOrder: number,
  depthTest: boolean,
  depthWrite: boolean
) {
  mesh.renderOrder = renderOrder
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  materials.forEach((material) => {
    material.depthTest = depthTest
    material.depthWrite = depthWrite
    material.needsUpdate = true
  })
}

interface AlbumGridTextDisplayProps {
  hoveredVersion: ExtendedVersion | null
  playingVersion: ExtendedVersion | null
  albumPalette: Album['palette'] | null
  isMobile?: boolean
  cameraDistance: number
}

/**
 * AlbumGridTextDisplay
 * - Used on ALBUM PAGES only (VersionOrbField scene)
 * - Playing version: always shown at front center (prominent)
 * - Hovered version (different from playing): shown at stable outer positions
 * - Uses album color palette for neon styling
 */
export function AlbumGridTextDisplay({
  hoveredVersion,
  playingVersion,
  albumPalette,
  isMobile = false,
  cameraDistance,
}: AlbumGridTextDisplayProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [flicker, setFlicker] = useState(1)
  const [shadowFlicker1, setShadowFlicker1] = useState(1)
  const [shadowFlicker2, setShadowFlicker2] = useState(1)
  const textLayout = useMemo(
    () => getAlbumGridTextLayout({ cameraDistance, isMobile }),
    [cameraDistance, isMobile]
  )
  
  // Determine which version to show and where
  const isShowingPlaying = !hoveredVersion || hoveredVersion.id === playingVersion?.id
  const displayVersion = hoveredVersion || playingVersion
  const hoverSpotIndex = useMemo(() => {
    if (!hoveredVersion || hoveredVersion.id === playingVersion?.id) return 0
    return getStableHoverSpotIndex(hoveredVersion.id, textLayout.hoverPositions.length)
  }, [hoveredVersion?.id, playingVersion?.id, textLayout.hoverPositions.length])
  const hoverPosition = textLayout.hoverPositions[hoverSpotIndex % textLayout.hoverPositions.length]
  const position = isShowingPlaying
    ? textLayout.playingPosition
    : hoverPosition

  // Use album palette passed from scene
  const palette = albumPalette || {
    dominant: '#090B0D',
    accent1: '#4F9EFF',
    accent2: '#FF6B4A',
  }

  // Use accent1 for main text (bright neon color), NOT dominant (which is often dark)
  const mainColor = palette.accent1 || palette.dominant || '#4F9EFF'
  const accent1 = palette.accent1 || mainColor
  const accent2 = palette.accent2 || accent1
  const { anchorY, depthTest, depthWrite, fontSize, maxWidth, renderOrder } = textLayout

  // Broken neon flickering for shadows / light
  useFrame(() => {
    // Flicker (2.5% chance)
    if (Math.random() < 0.025) {
      setFlicker(Math.random() < 0.3 ? 0.4 : 1)
    }

    // Shadow 1 (accent1) - 3% chance
    if (Math.random() < 0.03) {
      setShadowFlicker1(Math.random() < 0.4 ? 0.2 : 1)
    }

    // Shadow 2 (accent2) - 2.5% chance
    if (Math.random() < 0.025) {
      setShadowFlicker2(Math.random() < 0.3 ? 0.3 : 1)
    }
  })

  // Nothing hovered and nothing playing → show nothing
  if (!displayVersion) return null

  const label = displayVersion.label || 'Untitled Version'

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[-Math.PI / 12, 0, 0]} // Stand up with a subtle backward tilt so it sits in the 3D space
    >
      {/* Inner white glow - subtle, under colored text */}
      <Text
        position={[0, 0, 0.01]}
        fontSize={fontSize}
        color="#ffffff"
        anchorX="center"
        anchorY={anchorY}
        maxWidth={maxWidth}
        textAlign="center"
        fillOpacity={0.35}
        renderOrder={renderOrder}
        onSync={(mesh) => applyTextLayerMaterial(mesh, renderOrder, depthTest, depthWrite)}
      >
        {label}
      </Text>

      {/* Main text layer - album dominant color (BIG, always full opacity) */}
      <Text
        position={[0, 0, 0.02]}
        fontSize={fontSize}
        color={mainColor}
        anchorX="center"
        anchorY={anchorY}
        maxWidth={maxWidth}
        textAlign="center"
        outlineWidth={0.1}
        outlineColor="#000000"   // Dark outline for readability
        fillOpacity={1.0}
        renderOrder={renderOrder + 1}
        onSync={(mesh) => applyTextLayerMaterial(mesh, renderOrder + 1, depthTest, depthWrite)}
      >
        {label}
      </Text>

      {/* Bright color glow very close behind */}
      <Text
        position={[0, 0, -0.05]}
        fontSize={fontSize}
        color={mainColor}
        anchorX="center"
        anchorY={anchorY}
        maxWidth={maxWidth}
        textAlign="center"
        fillOpacity={0.9}
        renderOrder={renderOrder - 1}
        onSync={(mesh) => applyTextLayerMaterial(mesh, renderOrder - 1, depthTest, depthWrite)}
      >
        {label}
      </Text>

      {/* Softer outer glow layer */}
      <Text
        position={[0, 0, -0.15]}
        fontSize={fontSize}
        color={mainColor}
        anchorX="center"
        anchorY={anchorY}
        maxWidth={maxWidth}
        textAlign="center"
        fillOpacity={0.5}
        renderOrder={renderOrder - 2}
        onSync={(mesh) => applyTextLayerMaterial(mesh, renderOrder - 2, depthTest, depthWrite)}
      >
        {label}
      </Text>

      {/* Shadow 1 - accent1 color, slight offset */}
      <Text
        position={[0.18, 0, -0.25]}
        fontSize={fontSize}
        color={accent1}
        anchorX="center"
        anchorY={anchorY}
        maxWidth={maxWidth}
        textAlign="center"
        fillOpacity={0}
        outlineWidth={0.025}
        outlineColor={accent1}
        outlineOpacity={0.8 * shadowFlicker1}
        renderOrder={renderOrder - 3}
        onSync={(mesh) => applyTextLayerMaterial(mesh, renderOrder - 3, depthTest, depthWrite)}
      >
        {label}
      </Text>

      {/* Shadow 2 - accent2 color, opposite offset */}
      <Text
        position={[-0.15, 0, -0.35]}
        fontSize={fontSize}
        color={accent2}
        anchorX="center"
        anchorY={anchorY}
        maxWidth={maxWidth}
        textAlign="center"
        fillOpacity={0}
        outlineWidth={0.025}
        outlineColor={accent2}
        outlineOpacity={0.7 * shadowFlicker2}
        renderOrder={renderOrder - 4}
        onSync={(mesh) => applyTextLayerMaterial(mesh, renderOrder - 4, depthTest, depthWrite)}
      >
        {label}
      </Text>

      {/* Point light for subtle glow */}
      <pointLight
        position={[0, 0, 1]}
        color={mainColor}
        intensity={3 * flicker}
        distance={10}
      />
    </group>
  )
}
