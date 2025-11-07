'use client'

import { Attractor } from '@react-three/rapier-addons'
import { useThree, useFrame } from '@react-three/fiber'
import { useState } from 'react'
import * as THREE from 'three'

/**
 * Mouse attraction component - INVISIBLE VERSION
 * Tracks mouse and applies physics force to orbs
 * No visual elements - just pure attraction physics
 * 
 * @param albumCount - Number of orbs/versions (used to scale attraction for large albums)
 */
export function MouseAttraction({ albumCount }: { albumCount?: number }) {
  const { camera, pointer } = useThree()
  const [attractorPos, setAttractorPos] = useState<[number, number, number]>([0, 0, 0])
  
  // Dynamic attraction settings based on album size
  // Large albums (>15 orbs) need stronger, longer-range attraction
  const attractorRange = (albumCount && albumCount > 15) ? 30 : 20
  const attractorStrength = (albumCount && albumCount > 15) ? 150 : 100
  
  useFrame(() => {
    // Convert 2D mouse pointer to 3D world position
    const vector = new THREE.Vector3(pointer.x, pointer.y, 0.5)
    vector.unproject(camera)
    const dir = vector.sub(camera.position).normalize()
    const distance = 15
    const targetPos = camera.position.clone().add(dir.multiplyScalar(distance))
    
    // DEBUG: Log attractor position
    if (Math.random() < 0.016) {  // ~1 per second at 60fps
      console.log('🎯 Attractor position:', targetPos.x.toFixed(2), targetPos.y.toFixed(2), targetPos.z.toFixed(2))
      console.log('🖱️ Mouse pointer:', pointer.x.toFixed(2), pointer.y.toFixed(2))
      if (albumCount && albumCount > 15) {
        console.log('📊 Large album detected:', albumCount, 'orbs - using enhanced attraction')
      }
    }
    
    setAttractorPos([targetPos.x, targetPos.y, targetPos.z])
  })
  
  return (
    <Attractor 
      position={attractorPos}
      strength={attractorStrength}
      range={attractorRange}
      type="linear"
    />
  )
}
