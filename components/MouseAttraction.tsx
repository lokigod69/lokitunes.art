'use client'

import { Attractor } from '@react-three/rapier-addons'
import { useThree, useFrame } from '@react-three/fiber'
import { useState, memo, useEffect } from 'react'
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
  const attractorRange = !albumCount ? 40 :
                         albumCount > 20 ? 80 :   // Very large (25+ orbs) - BIGGER RANGE
                         albumCount > 15 ? 70 :   // Large (16-20 orbs) - BIGGER RANGE
                         albumCount > 10 ? 60 :   // Medium (11-15 orbs) - BIGGER RANGE
                         40                       // Small (≤10 orbs) - BIGGER RANGE
  
  const attractorStrength = !albumCount ? 300 :
                            albumCount > 20 ? 1000 :  // Very large - MUCH STRONGER
                            albumCount > 15 ? 800 :   // Large - MUCH STRONGER
                            albumCount > 10 ? 600 :   // Medium - MUCH STRONGER
                            300                       // Small - MUCH STRONGER
  
  // 🎯🎯🎯 DEBUG: Log mount/unmount and settings
  useEffect(() => {
    console.log('🎯🎯🎯 MouseAttraction MOUNTED for album with', albumCount, 'orbs')
    console.log('🎯 Settings: range=', attractorRange, 'strength=', attractorStrength)
    return () => console.log('🎯🎯🎯 MouseAttraction UNMOUNTED')
  }, [albumCount, attractorRange, attractorStrength])
  
  useFrame(() => {
    // Convert 2D mouse pointer to 3D world position
    const vector = new THREE.Vector3(pointer.x, pointer.y, 0.5)
    vector.unproject(camera)
    const dir = vector.sub(camera.position).normalize()
    const distance = 15
    const targetPos = camera.position.clone().add(dir.multiplyScalar(distance))
    
    setAttractorPos([targetPos.x, targetPos.y, targetPos.z])
    
    // 🎯 DEBUG: Log mouse and attractor position
    console.log('🎯 FRAME - Mouse:', pointer.x.toFixed(2), pointer.y.toFixed(2))
    console.log('🎯 FRAME - Attractor:', attractorPos)
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
