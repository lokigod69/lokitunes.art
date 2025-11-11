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
  
  // 🎯🎯🎯 DEBUG: Log mount/unmount and settings
  useEffect(() => {
    console.log('🎯🎯🎯 MouseAttraction MOUNTED for album with', albumCount, 'orbs')
    console.log('🎯🎯🎯 Physics Settings:', {
      albumCount,
      attractorRange,
      attractorStrength,
      comparison: albumCount === 10 ? 'PLATYPUS (10 orbs)' : albumCount === 7 ? 'DANCING CREATURES (7 orbs)' : `${albumCount} orbs`
    })
    return () => console.log('🎯🎯🎯 MouseAttraction UNMOUNTED')
  }, [albumCount, attractorRange, attractorStrength])
  
  useFrame(() => {
    frameCount.current++
    
    // Convert 2D mouse pointer to 3D world position
    const vector = new THREE.Vector3(pointer.x, pointer.y, 0.5)
    vector.unproject(camera)
    const dir = vector.sub(camera.position).normalize()
    const distance = 15
    const targetPos = camera.position.clone().add(dir.multiplyScalar(distance))
    
    setAttractorPos([targetPos.x, targetPos.y, targetPos.z])
    
    // 🎯🎯🎯 CRITICAL: Check which orbs are in range (log once per second to reduce spam)
    if (frameCount.current % 60 === 0) {
      const inRange: any[] = []
      const allOrbs: any[] = []
      
      // Get all rigid bodies from physics world
      world.forEachRigidBody((body) => {
        const translation = body.translation()
        const pos = [translation.x, translation.y, translation.z]
        
        const dx = targetPos.x - translation.x
        const dy = targetPos.y - translation.y
        const dz = targetPos.z - translation.z
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz)
        
        allOrbs.push({ distance: dist, pos })
        
        if (dist < attractorRange) {
          inRange.push({ distance: dist, pos })
        }
      })
      
      // Sort by distance (closest first)
      inRange.sort((a, b) => a.distance - b.distance)
      allOrbs.sort((a, b) => a.distance - b.distance)
      
      console.log(`🎯🎯🎯 RANGE CHECK: ${inRange.length} / ${allOrbs.length} orbs within range ${attractorRange}`)
      
      if (inRange.length > 0) {
        console.log(`🎯🎯🎯 CLOSEST IN RANGE: distance=${inRange[0].distance.toFixed(2)} at position [${inRange[0].pos.map((v: number) => v.toFixed(2)).join(', ')}]`)
      } else if (allOrbs.length > 0) {
        console.log(`🎯🎯🎯 NO ORBS IN RANGE! Closest is ${allOrbs[0].distance.toFixed(2)} away (need < ${attractorRange})`)
        console.log(`🎯🎯🎯 Closest orb at: [${allOrbs[0].pos.map((v: number) => v.toFixed(2)).join(', ')}]`)
        console.log(`🎯🎯🎯 Attractor at: [${targetPos.x.toFixed(2)}, ${targetPos.y.toFixed(2)}, ${targetPos.z.toFixed(2)}]`)
      } else {
        console.log(`🎯🎯🎯 NO ORBS FOUND! Physics world has no rigid bodies!`)
      }
    }
    
    // 🎯 DEBUG: Log mouse and attractor (reduced spam - every 60 frames)
    if (frameCount.current % 60 === 0) {
      console.log('🎯 FRAME - Mouse:', pointer.x.toFixed(2), pointer.y.toFixed(2))
      console.log('🎯 FRAME - Attractor Position:', {
        x: targetPos.x.toFixed(2),
        y: targetPos.y.toFixed(2),
        z: targetPos.z.toFixed(2)
      })
      console.log('🎯 FRAME - Physics Settings:', {
        albumCount,
        attractorRange,
        attractorStrength,
        type: 'linear'
      })
    }
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
