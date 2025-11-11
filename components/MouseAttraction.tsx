'use client'

import { Attractor } from '@react-three/rapier-addons'
import { useThree, useFrame } from '@react-three/fiber'
import { useState, memo } from 'react'
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
  const [attractorPos, setAttractorPos] = useState<[number, number, number]>([0, 0, 0])
  
  // Dynamic attraction settings based on album size
  // AGGRESSIVE scaling for large albums - more orbs need MUCH stronger pull
  const attractorRange = !albumCount ? 20 :
                         albumCount > 20 ? 50 :   // Very large (25+ orbs)
                         albumCount > 15 ? 40 :   // Large (16-20 orbs)
                         albumCount > 10 ? 30 :   // Medium (11-15 orbs)
                         20                       // Small (≤10 orbs)
  
  const attractorStrength = !albumCount ? 100 :
                            albumCount > 20 ? 300 :  // Very large
                            albumCount > 15 ? 200 :  // Large
                            albumCount > 10 ? 150 :  // Medium
                            100                      // Small
  
  useFrame(() => {
    // Convert 2D mouse pointer to 3D world position
    const vector = new THREE.Vector3(pointer.x, pointer.y, 0.5)
    vector.unproject(camera)
    const dir = vector.sub(camera.position).normalize()
    const distance = 15
    const targetPos = camera.position.clone().add(dir.multiplyScalar(distance))
    
    // DEBUG: Log attractor position and settings
    if (Math.random() < 0.016) {  // ~1 per second at 60fps
      console.log('🎯 Attractor position:', targetPos.x.toFixed(2), targetPos.y.toFixed(2), targetPos.z.toFixed(2))
      console.log('🖱️ Mouse pointer:', pointer.x.toFixed(2), pointer.y.toFixed(2))
      if (albumCount) {
        const level = albumCount > 20 ? 'VERY LARGE' : albumCount > 15 ? 'LARGE' : albumCount > 10 ? 'MEDIUM' : 'SMALL'
        console.log(`📊 Album: ${albumCount} orbs (${level}) → range=${attractorRange}, strength=${attractorStrength}`)
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

// Export memoized version to prevent re-renders
export const MouseAttraction = memo(MouseAttractionComponent)
