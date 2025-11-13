'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

export function NeonHeader({ position = [0, 11, 2] }: { position?: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null)
  const [flicker, setFlicker] = useState(1)
  const [shadowFlicker1, setShadowFlicker1] = useState(1)
  const [shadowFlicker2, setShadowFlicker2] = useState(1)
  const [shadowFlicker3, setShadowFlicker3] = useState(1)
  const [shadowFlicker4, setShadowFlicker4] = useState(1)
  
  // Broken neon flickering effect
  useFrame(() => {
    // Main text flicker (2.5% chance)
    if (Math.random() < 0.025) {
      setFlicker(Math.random() < 0.3 ? 0.4 : 1)
    }
    
    // Shadow 1 (red) flicker - 3% chance, more broken
    if (Math.random() < 0.03) {
      setShadowFlicker1(Math.random() < 0.4 ? 0.2 : 1)
    }
    
    // Shadow 2 (purple) flicker - 2.5% chance
    if (Math.random() < 0.025) {
      setShadowFlicker2(Math.random() < 0.3 ? 0.3 : 1)
    }
    
    // Shadow 3 (green) flicker - 3.5% chance, very broken
    if (Math.random() < 0.035) {
      setShadowFlicker3(Math.random() < 0.5 ? 0.1 : 1)
    }
    
    // Shadow 4 (cyan) flicker - 2% chance
    if (Math.random() < 0.02) {
      setShadowFlicker4(Math.random() < 0.3 ? 0.4 : 1)
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
      
      {/* Red shadow - bottom right offset - FLICKERS INDEPENDENTLY */}
      <Text
        position={[0.15, -0.15, -0.3]}
        fontSize={3.5}
        color="#ff0000"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0}
        outlineWidth={0.02}
        outlineColor="#ff0000"
        outlineOpacity={0.8 * shadowFlicker1}
      >
        LOKI TUNES
      </Text>
      
      {/* Purple shadow - left offset - FLICKERS INDEPENDENTLY */}
      <Text
        position={[-0.1, 0, -0.4]}
        fontSize={3.5}
        color="#ff00ff"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0}
        outlineWidth={0.02}
        outlineColor="#ff00ff"
        outlineOpacity={0.7 * shadowFlicker2}
      >
        LOKI TUNES
      </Text>
      
      {/* Green shadow - top left offset - FLICKERS INDEPENDENTLY (most broken!) */}
      <Text
        position={[-0.08, 0.08, -0.5]}
        fontSize={3.5}
        color="#00ff00"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0}
        outlineWidth={0.02}
        outlineColor="#00ff00"
        outlineOpacity={0.6 * shadowFlicker3}
      >
        LOKI TUNES
      </Text>
      
      {/* Cyan shadow - deep background - FLICKERS INDEPENDENTLY */}
      <Text
        position={[0.05, -0.05, -0.6]}
        fontSize={3.5}
        color="#00ffff"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0}
        outlineWidth={0.015}
        outlineColor="#00ffff"
        outlineOpacity={0.5 * shadowFlicker4}
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
