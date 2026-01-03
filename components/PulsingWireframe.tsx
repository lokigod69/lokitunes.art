'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { Album } from '@/lib/supabase'

/**
 * Pulsing Wireframe Box
 * Decorative cyberpunk element that pulses with time
 * Color-syncs with hovered album if provided
 */
export function PulsingWireframe({ 
  position, 
  size = [10, 10, 10],
  color = '#00ffff',
  hoveredAlbum = null
}: {
  position: [number, number, number]
  size?: [number, number, number]
  color?: string
  hoveredAlbum?: Album | null
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  
  const displayColor = color
  
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
    
    // Update color dynamically (smooth transition via Three.js)
    materialRef.current.color.set(displayColor)
  })
  
  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={size} />
      <meshBasicMaterial 
        ref={materialRef}
        color={color}
        wireframe
        transparent
        opacity={0.7}
      />
    </mesh>
  )
}
