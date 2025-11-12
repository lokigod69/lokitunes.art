'use client'

import { Attractor } from '@react-three/rapier-addons'
import { useThree, useFrame } from '@react-three/fiber'
import { useState, memo, useEffect, useRef } from 'react'
import { useRapier } from '@react-three/rapier'
import * as THREE from 'three'

/**
 * Mouse attraction component - INVISIBLE VERSION
 * Tracks mouse and applies physics force to orbs
 * No visual elements - just pure attraction physics
 * 
 * @param albumCount - Number of orbs/versions (used to scale attraction for large albums)
 */
// Wrap in React.memo to prevent infinite re-renders!
function MouseAttractionComponent({ albumCount }: { albumCount?: number }) {
  const { camera, pointer } = useThree()
  const { world } = useRapier()
  const [attractorPos, setAttractorPos] = useState<[number, number, number]>([0, 0, 0])
  const frameCount = useRef(0)
  
  // Dynamic attraction settings based on album size
  // AGGRESSIVE scaling for large albums - more orbs need MUCH stronger pull
  // 🚨 INCREASED BASE RANGE: Platypus orbs are 26+ units away, old range of 20 was too small!
  const attractorRange = !albumCount ? 35 :
                         albumCount > 20 ? 60 :   // Very large (25+ orbs)
                         albumCount > 15 ? 50 :   // Large (16-20 orbs)
                         albumCount > 10 ? 40 :   // Medium (11-15 orbs)
                         35                       // Small (≤10 orbs) - INCREASED from 20 to 35!
  
  const attractorStrength = !albumCount ? 100 :
                            albumCount > 20 ? 300 :  // Very large
                            albumCount > 15 ? 200 :  // Large
                            albumCount > 10 ? 150 :  // Medium
                            100                      // Small
  
  useFrame(() => {
    frameCount.current++
    
    // Convert 2D mouse pointer to 3D world position
    const vector = new THREE.Vector3(pointer.x, pointer.y, 0.5)
    vector.unproject(camera)
    const dir = vector.sub(camera.position).normalize()
    const distance = 15
    const targetPos = camera.position.clone().add(dir.multiplyScalar(distance))
    
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

// Export memoized version to prevent re-renders
export const MouseAttraction = memo(MouseAttractionComponent)
