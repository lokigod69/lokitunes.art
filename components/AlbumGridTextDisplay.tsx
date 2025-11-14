'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import type { Album } from '@/lib/supabase'
import type { ExtendedVersion } from './VersionOrb'

interface AlbumGridTextDisplayProps {
  version: ExtendedVersion | null
  albumPalette: Album['palette'] | null
  visible: boolean
}

/**
 * AlbumGridTextDisplay
 * - Used on ALBUM PAGES only (VersionOrbField scene)
 * - Shows the HOVERED version label
 * - Always centered on the album grid
 * - Uses album color palette for neon styling
 */
export function AlbumGridTextDisplay({ version, albumPalette, visible }: AlbumGridTextDisplayProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [flicker, setFlicker] = useState(1)
  const [shadowFlicker1, setShadowFlicker1] = useState(1)
  const [shadowFlicker2, setShadowFlicker2] = useState(1)

  // Centered position on album grid
  // Y = -12 raises text above grid a bit so it's easier to read when vertical
  // Z = -15 keeps text in the middle/back of the visible grid
  const position: [number, number, number] = [0, -12, -15]

  // Use album palette passed from scene
  const palette = albumPalette || {
    dominant: '#090B0D',
    accent1: '#4F9EFF',
    accent2: '#FF6B4A',
  }

  const mainColor = palette.dominant || '#4F9EFF'
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

  // Only show when hovering a version
  if (!version || !visible) return null

  const label = version.label || 'Untitled Version'

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[-Math.PI / 8, 0, 0]} // Stand up with a subtle tilt toward the camera
    >
      {/* Inner white glow - subtle, under colored text */}
      <Text
        position={[0, 0, 0.01]}
        fontSize={4.0}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={30}
        textAlign="center"
        fillOpacity={0.3}
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
        maxWidth={30}
        textAlign="center"
        outlineWidth={0.08}
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
        maxWidth={30}
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
        maxWidth={30}
        textAlign="center"
        fillOpacity={0.5}
      >
        {label}
      </Text>

      {/* Shadow 1 - accent1 color, slight offset */}
      <Text
        position={[0.15, 0, -0.25]}
        fontSize={4.0}
        color={accent1}
        anchorX="center"
        anchorY="middle"
        maxWidth={30}
        textAlign="center"
        fillOpacity={0}
        outlineWidth={0.02}
        outlineColor={accent1}
        outlineOpacity={0.8 * shadowFlicker1}
      >
        {label}
      </Text>

      {/* Shadow 2 - accent2 color, opposite offset */}
      <Text
        position={[-0.12, 0, -0.35]}
        fontSize={4.0}
        color={accent2}
        anchorX="center"
        anchorY="middle"
        maxWidth={30}
        textAlign="center"
        fillOpacity={0}
        outlineWidth={0.02}
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
