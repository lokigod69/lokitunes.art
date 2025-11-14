'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import type { Album } from '@/lib/supabase'
import { useAudioStore } from '@/lib/audio-store'

interface AlbumGridTextDisplayProps {
  albumPalette: Album['palette'] | null
}

/**
 * AlbumGridTextDisplay
 * - Used on ALBUM PAGES only (VersionOrbField scene)
 * - Shows the CURRENTLY PLAYING version label
 * - Always centered on the album grid
 * - Uses album color palette for neon styling
 */
export function AlbumGridTextDisplay({ albumPalette }: AlbumGridTextDisplayProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { currentVersion, currentPalette, isPlaying } = useAudioStore()
  const [mainFlicker, setMainFlicker] = useState(1)
  const [shadowFlicker1, setShadowFlicker1] = useState(1)
  const [shadowFlicker2, setShadowFlicker2] = useState(1)

  // Centered position on album grid
  // Y = -13.9 sits just above grid at -15
  // Z = -6 is the "sweet spot" for visibility
  const position: [number, number, number] = [0, -13.9, -6]

  // Prefer palette from currently playing track, fallback to album palette
  const palette = currentPalette || albumPalette || {
    dominant: '#090B0D',
    accent1: '#4F9EFF',
    accent2: '#FF6B4A',
  }

  const mainColor = palette.dominant || '#4F9EFF'
  const accent1 = palette.accent1 || mainColor
  const accent2 = palette.accent2 || accent1

  // Broken neon flickering
  useFrame(() => {
    // Main flicker (2.5% chance)
    if (Math.random() < 0.025) {
      setMainFlicker(Math.random() < 0.3 ? 0.4 : 1)
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

  // Only show when a version is actively playing
  if (!currentVersion || !isPlaying) return null

  const label = currentVersion.label || 'Untitled Version'

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]} // Lay flat on grid
    >
      {/* Main text layer - album dominant color */}
      <Text
        fontSize={1.5}
        color={mainColor}
        anchorX="center"
        anchorY="middle"
        maxWidth={30}            // Allow long names to stretch
        textAlign="center"
        outlineWidth={0.05}
        outlineColor="#000000"   // Dark outline for readability
        fillOpacity={mainFlicker}
      >
        {label}
      </Text>

      {/* Glow layer 1 */}
      <Text
        position={[0, 0, -0.1]}
        fontSize={1.5}
        color={mainColor}
        anchorX="center"
        anchorY="middle"
        maxWidth={30}
        textAlign="center"
        fillOpacity={0.5 * mainFlicker}
      >
        {label}
      </Text>

      {/* Glow layer 2 */}
      <Text
        position={[0, 0, -0.2]}
        fontSize={1.5}
        color={mainColor}
        anchorX="center"
        anchorY="middle"
        maxWidth={30}
        textAlign="center"
        fillOpacity={0.2 * mainFlicker}
      >
        {label}
      </Text>

      {/* Shadow 1 - accent1 color, slight offset */}
      <Text
        position={[0.12, 0, -0.25]}
        fontSize={1.5}
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
        position={[-0.1, 0, -0.35]}
        fontSize={1.5}
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
        intensity={1.2 * mainFlicker}
        distance={10}
      />
    </group>
  )
}
