'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Html } from '@react-three/drei'
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
      
      {/* Info display inside cube - always faces camera */}
      {hoveredAlbum && (
        <Html
          position={[0, 0, 0]}  // Center of cube
          center
          distanceFactor={15}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: displayColor,
              color: textColor,
              padding: '15px 25px',
              borderRadius: '8px',
              fontSize: '24px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              border: `3px solid ${textColor}`,
              whiteSpace: 'nowrap',
              boxShadow: `0 0 30px ${displayColor}, 0 4px 6px rgba(0, 0, 0, 0.3)`,
              backdropFilter: 'blur(4px)',
              transition: 'all 0.3s ease',
            }}
          >
            {hoveredAlbum.title}
          </div>
        </Html>
      )}
    </group>
  )
}
