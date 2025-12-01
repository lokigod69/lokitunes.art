'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import type { Album } from '@/lib/supabase'

// SAFE TEXT SPOTS - Constrained to visible grid area only!
// Z range: -10 to -3 (visible depth, away from camera)
// X range: -18 to 18 (visible width)
// Y: -13.9 (just above grid at -14)
const GRID_TEXT_SPOTS: [number, number, number][] = [
  // Left side positions
  [-15, -13.9, -8],    // Far left, mid-depth
  [-12, -13.9, -5],    // Mid-left, closer
  [-18, -13.9, -10],   // Far left, far depth
  [-10, -13.9, -3],    // Left, near edge
  
  // Center positions
  [-5, -13.9, -7],     // Center-left, mid-depth
  [0, -13.9, -8],      // Dead center, far
  [5, -13.9, -6],      // Center-right, mid-depth
  [0, -13.9, -4],      // Dead center, near
  
  // Right side positions
  [12, -13.9, -5],     // Mid-right, closer
  [15, -13.9, -8],     // Far right, mid-depth
  [18, -13.9, -10],    // Far right, far depth
  [10, -13.9, -3],     // Right, near edge
]

interface GridTextDisplayProps {
  album: Album | null
  visible: boolean
}

/**
 * Grid Text Display - Neon text projected on grid floor
 * Shows album name with LOKI TUNES style when hovering orbs
 */
export function GridTextDisplay({ album, visible }: GridTextDisplayProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [position, setPosition] = useState<[number, number, number]>(GRID_TEXT_SPOTS[0])
  
  // Flicker states (independent for broken neon effect)
  const [mainFlicker, setMainFlicker] = useState(1)
  const [shadow1Flicker, setShadow1Flicker] = useState(1)
  const [shadow2Flicker, setShadow2Flicker] = useState(1)
  const [shadow3Flicker, setShadow3Flicker] = useState(1)
  
  // Pick random spot when album changes
  useEffect(() => {
    if (album) {
      const randomIndex = Math.floor(Math.random() * GRID_TEXT_SPOTS.length)
      setPosition(GRID_TEXT_SPOTS[randomIndex])
    }
  }, [album?.id])
  
  // Broken neon flickering (like header)
  useFrame(() => {
    // Main text flicker (2.5% chance)
    if (Math.random() < 0.025) {
      setMainFlicker(Math.random() < 0.3 ? 0.4 : 1)
    }
    
    // Shadow 1 flicker - more broken (3% chance)
    if (Math.random() < 0.03) {
      setShadow1Flicker(Math.random() < 0.4 ? 0.2 : 1)
    }
    
    // Shadow 2 flicker (2.5% chance)
    if (Math.random() < 0.025) {
      setShadow2Flicker(Math.random() < 0.3 ? 0.3 : 1)
    }
    
    // Shadow 3 flicker - most broken (3.5% chance)
    if (Math.random() < 0.035) {
      setShadow3Flicker(Math.random() < 0.5 ? 0.1 : 1)
    }
  })
  
  if (!album || !visible) return null
  
  // Color adaptation from album palette
  const mainColor = album.palette?.dominant || '#4F9EFF'
  const shadow1Color = album.palette?.accent1 || mainColor
  const shadow2Color = album.palette?.accent2 || shadow1Color
  const shadow3Color = mainColor  // Use main color for third shadow
  
  return (
    <group 
      ref={groupRef}
      position={position}
      rotation={[-Math.PI / 6, 0, 0]}  // Slight tilt toward camera (~30° on X-axis) for readability
    >
      {/* Main text layer - album dominant color */}
      <Text
        fontSize={2.5}
        color={mainColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
        renderOrder={10}
        material-depthTest={false}
      >
        {album.title}
      </Text>
      
      {/* Glow layer 1 - slightly behind */}
      <Text
        position={[0, 0, -0.1]}
        fontSize={2.5}
        color={mainColor}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.5 * mainFlicker}
        renderOrder={9}
        material-depthTest={false}
      >
        {album.title}
      </Text>
      
      {/* Glow layer 2 - further behind */}
      <Text
        position={[0, 0, -0.2]}
        fontSize={2.5}
        color={mainColor}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.2 * mainFlicker}
        renderOrder={8}
        material-depthTest={false}
      >
        {album.title}
      </Text>
      
      {/* Shadow 1 - accent1 color, bottom right offset */}
      <Text
        position={[0.15, 0, -0.3]}
        fontSize={2.5}
        color={shadow1Color}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0}
        outlineWidth={0.02}
        outlineColor={shadow1Color}
        outlineOpacity={0.8 * shadow1Flicker}
        renderOrder={7}
        material-depthTest={false}
      >
        {album.title}
      </Text>
      
      {/* Shadow 2 - accent2 color, left offset */}
      <Text
        position={[-0.1, 0, -0.4]}
        fontSize={2.5}
        color={shadow2Color}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0}
        outlineWidth={0.02}
        outlineColor={shadow2Color}
        outlineOpacity={0.7 * shadow2Flicker}
        renderOrder={6}
        material-depthTest={false}
      >
        {album.title}
      </Text>
      
      {/* Shadow 3 - main color, top left offset */}
      <Text
        position={[-0.08, 0, -0.5]}
        fontSize={2.5}
        color={shadow3Color}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0}
        outlineWidth={0.02}
        outlineColor={shadow3Color}
        outlineOpacity={0.6 * shadow3Flicker}
        renderOrder={5}
        material-depthTest={false}
      >
        {album.title}
      </Text>
      
      {/* Point light for glow effect */}
      <pointLight 
        position={[0, 0, 1]} 
        color={mainColor}
        intensity={1.5 * mainFlicker}
        distance={10}
      />
    </group>
  )
}
