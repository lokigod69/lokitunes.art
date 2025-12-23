'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import type { Album } from '@/lib/supabase'
import type { ExtendedVersion } from './VersionOrb'

// FIXED TEXT POSITIONS - Consistent across ALL albums regardless of orb count
// Text should be IN FRONT of grid but WITHIN the black container bounds
// Grid is at Z=-10 (desktop) or Z=-15 (mobile), so text at Z=5-8 is in front
// Maximum safe Z is ~8 to stay within container's ~10% black space at front
const TEXT_CONFIG = {
  // Y position: slightly above grid plane for visibility
  positionY: -11,
  // Z position: in front of grid, within container bounds
  // FIXED - never changes based on orb count or camera distance
  frontCenterZ: 6,  // Playing version - prominent but not too far forward
  hoverSpotsZ: { min: 3, max: 5 },  // Hovered versions - slightly behind front center
  maxSafeZ: 8,  // Never exceed this to stay within container
} as const

// Front center position - for playing version (prominent, always visible)
const FRONT_CENTER_POSITION: [number, number, number] = [0, TEXT_CONFIG.positionY, TEXT_CONFIG.frontCenterZ]

// Outer-edge text spots - for hovered versions
// All Z values clamped to safe range to prevent text from extending beyond container
const ALBUM_TEXT_SPOTS: [number, number, number][] = [
  // Left edge
  [-10, TEXT_CONFIG.positionY, 4],
  [-8, TEXT_CONFIG.positionY, 3],
  [-12, TEXT_CONFIG.positionY, 3],
  // Right edge
  [10, TEXT_CONFIG.positionY, 4],
  [8, TEXT_CONFIG.positionY, 3],
  [12, TEXT_CONFIG.positionY, 3],
  // Center variations
  [-4, TEXT_CONFIG.positionY, 4],
  [0, TEXT_CONFIG.positionY, 3],
  [4, TEXT_CONFIG.positionY, 4],
  // Additional positions - kept within safe bounds
  [-6, TEXT_CONFIG.positionY, 5],
  [0, TEXT_CONFIG.positionY, 5],
  [6, TEXT_CONFIG.positionY, 5],
]

interface AlbumGridTextDisplayProps {
  hoveredVersion: ExtendedVersion | null
  playingVersion: ExtendedVersion | null
  albumPalette: Album['palette'] | null
}

/**
 * AlbumGridTextDisplay
 * - Used on ALBUM PAGES only (VersionOrbField scene)
 * - Playing version: always shown at front center (prominent)
 * - Hovered version (different from playing): shown at random outer positions
 * - Uses album color palette for neon styling
 */
export function AlbumGridTextDisplay({ hoveredVersion, playingVersion, albumPalette }: AlbumGridTextDisplayProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [flicker, setFlicker] = useState(1)
  const [shadowFlicker1, setShadowFlicker1] = useState(1)
  const [shadowFlicker2, setShadowFlicker2] = useState(1)
  
  // Random outer-edge position for hovered versions
  const [hoverPosition, setHoverPosition] = useState<[number, number, number]>(ALBUM_TEXT_SPOTS[0])
  
  // Pick new random position when hovering a DIFFERENT version than playing
  useEffect(() => {
    if (hoveredVersion && hoveredVersion.id !== playingVersion?.id) {
      const randomIndex = Math.floor(Math.random() * ALBUM_TEXT_SPOTS.length)
      setHoverPosition(ALBUM_TEXT_SPOTS[randomIndex])
    }
  }, [hoveredVersion?.id, playingVersion?.id])
  
  // Determine which version to show and where
  const isShowingPlaying = !hoveredVersion || hoveredVersion.id === playingVersion?.id
  const displayVersion = hoveredVersion || playingVersion
  const position = isShowingPlaying ? FRONT_CENTER_POSITION : hoverPosition

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
        fontSize={4.0}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={40}
        textAlign="center"
        fillOpacity={0.35}
      >
        {label}
      </Text>

      {/* Main text layer - album dominant color (BIG, always full opacity) */}
      <Text
        position={[0, 0, 0.02]}
        fontSize={4.0}
        color={mainColor}
        anchorX="center"
        anchorY="middle"
        maxWidth={40}
        textAlign="center"
        outlineWidth={0.1}
        outlineColor="#000000"   // Dark outline for readability
        fillOpacity={1.0}
      >
        {label}
      </Text>

      {/* Bright color glow very close behind */}
      <Text
        position={[0, 0, -0.05]}
        fontSize={4.0}
        color={mainColor}
        anchorX="center"
        anchorY="middle"
        maxWidth={40}
        textAlign="center"
        fillOpacity={0.9}
      >
        {label}
      </Text>

      {/* Softer outer glow layer */}
      <Text
        position={[0, 0, -0.15]}
        fontSize={4.0}
        color={mainColor}
        anchorX="center"
        anchorY="middle"
        maxWidth={40}
        textAlign="center"
        fillOpacity={0.5}
      >
        {label}
      </Text>

      {/* Shadow 1 - accent1 color, slight offset */}
      <Text
        position={[0.18, 0, -0.25]}
        fontSize={4.0}
        color={accent1}
        anchorX="center"
        anchorY="middle"
        maxWidth={40}
        textAlign="center"
        fillOpacity={0}
        outlineWidth={0.025}
        outlineColor={accent1}
        outlineOpacity={0.8 * shadowFlicker1}
      >
        {label}
      </Text>

      {/* Shadow 2 - accent2 color, opposite offset */}
      <Text
        position={[-0.15, 0, -0.35]}
        fontSize={4.0}
        color={accent2}
        anchorX="center"
        anchorY="middle"
        maxWidth={40}
        textAlign="center"
        fillOpacity={0}
        outlineWidth={0.025}
        outlineColor={accent2}
        outlineOpacity={0.7 * shadowFlicker2}
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
