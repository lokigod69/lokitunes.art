'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import type { Album } from '@/lib/supabase'
import { getContrastColor } from '@/lib/colorUtils'

interface InfoDisplayCubeProps {
  position: [number, number, number]
  size?: [number, number, number]
  baseColor?: string
  hoveredAlbum: Album | null
}

/**
 * Enhanced Pulsing Wireframe Cube with Info Display
 * Shows album information when user hovers over orbs
 * Text is actual 3D geometry - cube edges pass in front for depth effect!
 */
export function InfoDisplayCube({ 
  position, 
  size = [4, 2, 4],
  baseColor = '#00ff88',
  hoveredAlbum
}: InfoDisplayCubeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  
  // Use album color if hovering, otherwise base color
  const displayColor = hoveredAlbum?.palette?.dominant || baseColor
  const textColor = getContrastColor(displayColor)
  
  useFrame((state) => {
    if (!materialRef.current) return
    
    // Pulse opacity with time
    const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.3 + 0.7
    materialRef.current.opacity = pulse
    
    // Gentle rotation
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.005
      meshRef.current.rotation.y += 0.007
    }
    
    // Update color dynamically
    materialRef.current.color.set(displayColor)
  })
  
  return (
    <group position={position}>
      {/* Rotating wireframe cube */}
      <mesh ref={meshRef}>
        <boxGeometry args={size} />
        <meshBasicMaterial 
          ref={materialRef}
          color={displayColor}
          wireframe
          transparent
          opacity={0.7}
        />
      </mesh>
      
      {/* 3D Text inside cube - edges pass in front for depth effect! */}
      {hoveredAlbum && (
        <Text
          position={[0, 0, 0]}  // Center of cube
          fontSize={1}          // Adjust to fit inside cube
          color={textColor}     // Dynamic contrast color
          anchorX="center"
          anchorY="middle"
          maxWidth={3.5}        // Fit within cube width
          textAlign="center"
          letterSpacing={0.05}
          outlineWidth={0.08}   // Thick outline for readability
          outlineColor={displayColor}  // Album color outline
          outlineOpacity={0.9}
          // Text is 3D geometry - depth testing enabled by default!
          // Cube edges will naturally pass in front as they rotate
        >
          {hoveredAlbum.title}
        </Text>
      )}
    </group>
  )
}
