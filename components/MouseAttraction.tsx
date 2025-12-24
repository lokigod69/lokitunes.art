'use client'

import { useThree, useFrame } from '@react-three/fiber'
import { memo, useEffect, useRef } from 'react'
import { useRapier } from '@react-three/rapier'
import * as THREE from 'three'
import { applyAttractorForceOnRigidBody } from '@react-three/rapier-addons'

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
  const attractorObject = useRef<THREE.Object3D>(null)
  const frameCount = useRef(0)
  const lastPointer = useRef({ x: 0, y: 0 })
  
  // Movement threshold - ignore tiny mouse movements to keep orbs calmer
  const MOVEMENT_THRESHOLD = 0.008  // Minimum pointer delta to trigger force
  const MOVEMENT_SCALE_MAX = 0.08   // Movement delta that gives full force
  
  // Dynamic attraction settings based on album size
  // Range scales with album size (larger albums need longer reach)
  // 🚨 INCREASED BASE RANGE: Platypus orbs are 26+ units away, old range of 20 was too small!
  const attractorRange = !albumCount ? 35 :
                         albumCount > 20 ? 60 :   // Very large (25+ orbs)
                         albumCount > 15 ? 50 :   // Large (16-20 orbs)
                         albumCount > 10 ? 40 :   // Medium (11-15 orbs)
                         35                       // Small (≤10 orbs) - INCREASED from 20 to 35!
  
  // ✅ FIX 2: Consistent strength for all album sizes (was scaled 100-300, penalizing small albums)
  // ✅ FIX M1: 20% boost for touch devices (less precise input needs stronger attraction)
  // ✅ FIX: Increased desktop strength for more responsive physics
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window
  const baseStrength = 250  // Increased from 150 for more responsive desktop physics
  const attractorStrength = isTouchDevice ? baseStrength * 0.8 : baseStrength  // 200 on mobile, 250 on desktop
  
  useFrame(() => {
    frameCount.current++
    
    // Calculate mouse movement delta
    const deltaX = pointer.x - lastPointer.current.x
    const deltaY = pointer.y - lastPointer.current.y
    const movementDelta = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    // Update last position
    lastPointer.current = { x: pointer.x, y: pointer.y }
    
    // Convert 2D mouse pointer to 3D world position
    const vector = new THREE.Vector3(pointer.x, pointer.y, 0.5)
    vector.unproject(camera)
    const dir = vector.sub(camera.position).normalize()
    const distance = 15
    const targetPos = camera.position.clone().add(dir.multiplyScalar(distance))

    if (!attractorObject.current) return
    attractorObject.current.position.set(targetPos.x, targetPos.y, targetPos.z)
    
    // Skip force application if mouse barely moved (keeps orbs calm)
    if (movementDelta < MOVEMENT_THRESHOLD) return
    
    // Scale force by movement speed: gentle for slow moves, full strength for fast swipes
    const movementScale = Math.min(movementDelta / MOVEMENT_SCALE_MAX, 1)
    const scaledStrength = attractorStrength * movementScale

    const object = attractorObject.current

    world.bodies.forEach((body) => {
      if (!body.isDynamic()) return
      applyAttractorForceOnRigidBody(body, {
        object,
        strength: scaledStrength,
        range: attractorRange,
        type: 'linear',
        gravitationalConstant: 6.673e-11,
      })
    })
  })
  
  return (
    <object3D ref={attractorObject} />
  )
}

// Export memoized version to prevent re-renders
export const MouseAttraction = memo(MouseAttractionComponent)
