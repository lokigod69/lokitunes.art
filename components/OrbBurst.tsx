/**
 * OrbBurst - Lightweight burst effect when an orb is destroyed
 * Simple scale+fade effect instead of heavy particle system
 */
'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface OrbBurstProps {
  position: [number, number, number]
  colors: string[]  // Album palette colors (uses first color)
  onComplete: () => void  // Called when animation finishes
}

export function OrbBurst({ position, colors, onComplete }: OrbBurstProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const elapsedRef = useRef(0)
  const duration = 0.35  // Very quick burst
  
  // Get primary color from palette
  const color = colors[0] || '#ffffff'
  
  useFrame((_, delta) => {
    elapsedRef.current += delta
    const progress = Math.min(elapsedRef.current / duration, 1)
    
    // Animate sphere: scale up + fade out + flash white
    if (meshRef.current) {
      const scale = 1 + progress * 1.5  // 1.0 → 2.5
      meshRef.current.scale.setScalar(scale)
      
      const material = meshRef.current.material as THREE.MeshBasicMaterial
      material.opacity = 1 - progress
      
      // Flash white at start, then transition to color
      if (progress < 0.2) {
        material.color.setHex(0xffffff)
      } else {
        material.color.set(color)
      }
    }
    
    // Animate ring: expand outward + fade
    if (ringRef.current) {
      const ringScale = 1 + progress * 4  // Expand faster
      ringRef.current.scale.setScalar(ringScale)
      
      const ringMat = ringRef.current.material as THREE.MeshBasicMaterial
      ringMat.opacity = (1 - progress) * 0.8
    }
    
    if (progress >= 1) {
      onComplete()
    }
  })
  
  return (
    <group position={position}>
      {/* Expanding sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.8, 12, 12]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Expanding ring for extra pop */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.8, 24]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}
