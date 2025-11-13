'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

export function NeonHeader({ position = [0, 16, 2] }: { position?: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null)
  const [flicker, setFlicker] = useState(1)
  
  // Broken neon flickering effect (2-3% chance per frame)
  useFrame(() => {
    if (Math.random() < 0.025) {
      // 70% full brightness, 30% dim
      setFlicker(Math.random() < 0.3 ? 0.4 : 1)
    }
    
    // Very subtle rotation
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(Date.now() * 0.0001) * 0.05
    }
  })
  
  return (
    <group ref={groupRef} position={position}>
      {/* Main text "LOKI TUNES" - Cyan - FRONT LAYER */}
      <Text
        position={[0, 0, 0]}
        fontSize={3.5}
        color="#00ffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        LOKI TUNES
      </Text>
      
      {/* Glow layer 1 - slightly behind */}
      <Text
        position={[0, 0, -0.1]}
        fontSize={3.5}
        color="#00ffff"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.5 * flicker}
      >
        LOKI TUNES
      </Text>
      
      {/* Glow layer 2 - further behind */}
      <Text
        position={[0, 0, -0.2]}
        fontSize={3.5}
        color="#00ffff"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.2 * flicker}
      >
        LOKI TUNES
      </Text>
      
      {/* 3D SHADOW EFFECT - Text outlines at different depths */}
      
      {/* Red shadow - bottom right offset */}
      <Text
        position={[0.15, -0.15, -0.3]}
        fontSize={3.5}
        color="#ff0000"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0}
        outlineWidth={0.02}
        outlineColor="#ff0000"
        outlineOpacity={0.8 * flicker}
      >
        LOKI TUNES
      </Text>
      
      {/* Purple shadow - left offset */}
      <Text
        position={[-0.1, 0, -0.4]}
        fontSize={3.5}
        color="#ff00ff"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0}
        outlineWidth={0.02}
        outlineColor="#ff00ff"
        outlineOpacity={0.7 * flicker}
      >
        LOKI TUNES
      </Text>
      
      {/* Green shadow - top left offset */}
      <Text
        position={[-0.08, 0.08, -0.5]}
        fontSize={3.5}
        color="#00ff00"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0}
        outlineWidth={0.02}
        outlineColor="#00ff00"
        outlineOpacity={0.6 * flicker}
      >
        LOKI TUNES
      </Text>
      
      {/* Cyan shadow - deep background */}
      <Text
        position={[0.05, -0.05, -0.6]}
        fontSize={3.5}
        color="#00ffff"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0}
        outlineWidth={0.015}
        outlineColor="#00ffff"
        outlineOpacity={0.5 * flicker}
      >
        LOKI TUNES
      </Text>
      
      {/* Point light for extra glow */}
      <pointLight 
        position={[0, 0, 1]} 
        color="#00ffff"
        intensity={2 * flicker}
        distance={15}
      />
    </group>
  )
}
