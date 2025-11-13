'use client'

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

interface WireframeLineProps {
  start: [number, number, number]
  end: [number, number, number]
  color: string
  flicker: number
  opacity?: number
}

function WireframeLine({ start, end, color, flicker, opacity = 1 }: WireframeLineProps) {
  const points = useMemo(() => [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end)
  ], [start, end])
  
  const lineGeometry = useMemo(() => 
    new THREE.BufferGeometry().setFromPoints(points),
    [points]
  )
  
  return (
    <line geometry={lineGeometry}>
      <lineBasicMaterial 
        color={color} 
        opacity={opacity * flicker}
        transparent
        linewidth={2}
      />
    </line>
  )
}

export function NeonHeader({ position = [0, 12, -5] }: { position?: [number, number, number] }) {
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
      {/* Main text "LOKI TUNES" - Cyan */}
      <Text
        position={[0, 0, 0.3]}
        fontSize={1.8}
        color="#00ffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/SpaceMono-Bold.ttf"
        outlineWidth={0.03}
        outlineColor="#000000"
        letterSpacing={0.1}
      >
        LOKI TUNES
      </Text>
      
      {/* Glowing layer behind text */}
      <Text
        position={[0, 0, 0.25]}
        fontSize={1.85}
        color="#00ffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/SpaceMono-Bold.ttf"
        fillOpacity={0.5 * flicker}
        letterSpacing={0.1}
      >
        LOKI TUNES
      </Text>
      
      {/* Extra glow layer */}
      <Text
        position={[0, 0, 0.2]}
        fontSize={1.9}
        color="#00ffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/SpaceMono-Bold.ttf"
        fillOpacity={0.2 * flicker}
        letterSpacing={0.1}
      >
        LOKI TUNES
      </Text>
      
      {/* 3D WIREFRAME ACCENT LINES - Sparse, multi-color, sophisticated */}
      
      {/* L - Red accent lines (3 lines) */}
      <WireframeLine start={[-7.5, 0.8, 0.4]} end={[-7.0, 1.0, 0.6]} color="#ff0000" flicker={flicker} opacity={0.8} />
      <WireframeLine start={[-7.5, -0.8, 0.3]} end={[-7.0, -0.6, 0.5]} color="#ff0000" flicker={flicker} opacity={0.7} />
      <WireframeLine start={[-7.2, 0.2, 0.2]} end={[-6.8, -0.3, 0.7]} color="#ff0000" flicker={flicker} opacity={0.6} />
      
      {/* O - Purple accent lines (4 lines) */}
      <WireframeLine start={[-6.0, 0.7, 0.5]} end={[-5.5, 0.9, 0.3]} color="#ff00ff" flicker={flicker} opacity={0.8} />
      <WireframeLine start={[-6.0, -0.7, 0.4]} end={[-5.5, -0.5, 0.6]} color="#ff00ff" flicker={flicker} opacity={0.7} />
      <WireframeLine start={[-5.8, 0.3, 0.3]} end={[-5.3, 0.5, 0.5]} color="#ff00ff" flicker={flicker} opacity={0.6} />
      <WireframeLine start={[-5.7, -0.2, 0.6]} end={[-5.4, -0.4, 0.4]} color="#ff00ff" flicker={flicker} opacity={0.5} />
      
      {/* K - Green accent lines (3 lines) */}
      <WireframeLine start={[-4.5, 0.8, 0.4]} end={[-4.0, 0.6, 0.6]} color="#00ff00" flicker={flicker} opacity={0.8} />
      <WireframeLine start={[-4.5, -0.8, 0.3]} end={[-4.0, -0.6, 0.5]} color="#00ff00" flicker={flicker} opacity={0.7} />
      <WireframeLine start={[-4.3, 0.0, 0.5]} end={[-3.8, 0.4, 0.3]} color="#00ff00" flicker={flicker} opacity={0.6} />
      
      {/* I - Cyan accent lines (2 lines) */}
      <WireframeLine start={[-3.0, 0.9, 0.4]} end={[-2.7, 0.7, 0.6]} color="#00ffff" flicker={flicker} opacity={0.8} />
      <WireframeLine start={[-3.0, -0.9, 0.3]} end={[-2.7, -0.7, 0.5]} color="#00ffff" flicker={flicker} opacity={0.7} />
      
      {/* T - Red/Cyan mix (3 lines) */}
      <WireframeLine start={[-1.5, 0.9, 0.5]} end={[-1.0, 0.8, 0.3]} color="#ff0000" flicker={flicker} opacity={0.8} />
      <WireframeLine start={[-1.3, 0.3, 0.4]} end={[-0.9, -0.7, 0.6]} color="#00ffff" flicker={flicker} opacity={0.7} />
      <WireframeLine start={[-1.2, -0.9, 0.3]} end={[-0.8, -0.6, 0.5]} color="#ff0000" flicker={flicker} opacity={0.6} />
      
      {/* U - Purple accent lines (4 lines) */}
      <WireframeLine start={[0.5, 0.8, 0.4]} end={[1.0, 0.6, 0.6]} color="#ff00ff" flicker={flicker} opacity={0.8} />
      <WireframeLine start={[0.5, -0.8, 0.3]} end={[1.0, -0.6, 0.5]} color="#ff00ff" flicker={flicker} opacity={0.7} />
      <WireframeLine start={[0.7, 0.2, 0.5]} end={[1.2, 0.0, 0.3]} color="#ff00ff" flicker={flicker} opacity={0.6} />
      <WireframeLine start={[0.8, -0.3, 0.4]} end={[1.3, -0.5, 0.6]} color="#ff00ff" flicker={flicker} opacity={0.5} />
      
      {/* N - Green accent lines (3 lines) */}
      <WireframeLine start={[2.0, 0.9, 0.5]} end={[2.5, 0.7, 0.3]} color="#00ff00" flicker={flicker} opacity={0.8} />
      <WireframeLine start={[2.0, -0.9, 0.4]} end={[2.5, -0.7, 0.6]} color="#00ff00" flicker={flicker} opacity={0.7} />
      <WireframeLine start={[2.2, 0.3, 0.3]} end={[2.7, -0.2, 0.5]} color="#00ff00" flicker={flicker} opacity={0.6} />
      
      {/* E - Cyan accent lines (3 lines) */}
      <WireframeLine start={[3.5, 0.8, 0.4]} end={[4.0, 0.6, 0.6]} color="#00ffff" flicker={flicker} opacity={0.8} />
      <WireframeLine start={[3.5, 0.0, 0.5]} end={[4.0, 0.2, 0.3]} color="#00ffff" flicker={flicker} opacity={0.7} />
      <WireframeLine start={[3.5, -0.8, 0.3]} end={[4.0, -0.6, 0.5]} color="#00ffff" flicker={flicker} opacity={0.6} />
      
      {/* S - Red/Purple mix (4 lines) */}
      <WireframeLine start={[5.0, 0.8, 0.5]} end={[5.5, 0.6, 0.3]} color="#ff0000" flicker={flicker} opacity={0.8} />
      <WireframeLine start={[5.0, 0.2, 0.4]} end={[5.5, 0.0, 0.6]} color="#ff00ff" flicker={flicker} opacity={0.7} />
      <WireframeLine start={[5.0, -0.3, 0.3]} end={[5.5, -0.5, 0.5]} color="#ff0000" flicker={flicker} opacity={0.6} />
      <WireframeLine start={[5.2, -0.8, 0.4]} end={[5.7, -0.6, 0.6]} color="#ff00ff" flicker={flicker} opacity={0.5} />
      
      {/* Bottom border - Multi-color continuous line */}
      <WireframeLine start={[-8, -1.2, 0.3]} end={[-5, -1.2, 0.3]} color="#ff0000" flicker={flicker} opacity={0.6} />
      <WireframeLine start={[-5, -1.2, 0.3]} end={[-2, -1.2, 0.3]} color="#ff00ff" flicker={flicker} opacity={0.6} />
      <WireframeLine start={[-2, -1.2, 0.3]} end={[1, -1.2, 0.3]} color="#00ff00" flicker={flicker} opacity={0.6} />
      <WireframeLine start={[1, -1.2, 0.3]} end={[4, -1.2, 0.3]} color="#00ffff" flicker={flicker} opacity={0.6} />
      <WireframeLine start={[4, -1.2, 0.3]} end={[6.5, -1.2, 0.3]} color="#ff00ff" flicker={flicker} opacity={0.6} />
      
      {/* Top accent line - Sparse segments */}
      <WireframeLine start={[-7, 1.2, 0.4]} end={[-5, 1.2, 0.4]} color="#00ffff" flicker={flicker} opacity={0.5} />
      <WireframeLine start={[-3, 1.2, 0.4]} end={[-1, 1.2, 0.4]} color="#ff00ff" flicker={flicker} opacity={0.5} />
      <WireframeLine start={[1, 1.2, 0.4]} end={[3, 1.2, 0.4]} color="#00ff00" flicker={flicker} opacity={0.5} />
      <WireframeLine start={[4, 1.2, 0.4]} end={[6, 1.2, 0.4]} color="#ff0000" flicker={flicker} opacity={0.5} />
      
      {/* Point light for extra glow */}
      <pointLight position={[0, 0, 2]} intensity={1.5 * flicker} color="#00ffff" distance={15} />
    </group>
  )
}
