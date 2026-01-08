// Changes: Smooth mouse attraction ramp (speed+accel smoothing) and keep a gentle baseline pull; allow optionally locking the attractor to a Z-plane to prevent camera-zoom drift in other scenes (2025-12-24)
'use client'

import { useThree, useFrame } from '@react-three/fiber'
import { memo, useRef } from 'react'
import { useRapier } from '@react-three/rapier'
import * as THREE from 'three'
import { applyAttractorForceOnRigidBody } from '@react-three/rapier-addons'

/**
 * Mouse attraction component - INVISIBLE VERSION
 * Tracks mouse and applies physics force to orbs
 * No visual elements - just pure attraction physics
 * 
 * @param albumCount - Number of orbs/versions (used to scale attraction for large albums)
 * @param targetPlaneZ - Optional Z plane to project pointer ray onto for attractor position
 */
// Wrap in React.memo to prevent infinite re-renders!
function MouseAttractionComponent({ albumCount, targetPlaneZ, baselineStrength = 0.12, strengthScale = 1, speedFull = 4.0, accelFull = 40.0, cohesionStrength = 0, idleBaselineMultiplier = 1, softCoreRadius = 0 }: { albumCount?: number; targetPlaneZ?: number; baselineStrength?: number; strengthScale?: number; speedFull?: number; accelFull?: number; cohesionStrength?: number; idleBaselineMultiplier?: number; softCoreRadius?: number }) {
  const { camera, pointer } = useThree()
  const { world } = useRapier()
  const attractorObject = useRef<THREE.Object3D>(null)
  const cohesionObject = useRef<THREE.Object3D>(null)
  const frameCount = useRef(0)
  const lastPointer = useRef({ x: 0, y: 0 })
  const smoothedSpeed = useRef(0)
  const smoothedAccel = useRef(0)
  const lastSpeed = useRef(0)
  const baselineMul = useRef(1)
  
  // Movement threshold - ignore tiny mouse movements to keep orbs calmer
  const MOVEMENT_THRESHOLD = 0.0035  // Minimum pointer delta to trigger force
  
  // Dynamic attraction settings based on album size
  // Range scales with album size (larger albums need longer reach)
  // INCREASED BASE RANGE: Platypus orbs are 26+ units away, old range of 20 was too small!
  const attractorRange = !albumCount ? 35 :
                         albumCount > 20 ? 60 :   // Very large (25+ orbs)
                         albumCount > 15 ? 50 :   // Large (16-20 orbs)
                         albumCount > 10 ? 40 :   // Medium (11-15 orbs)
                         35                       // Small (≤10 orbs) - INCREASED from 20 to 35!
  
  // FIX 2: Consistent strength for all album sizes (was scaled 100-300, penalizing small albums)
  // FIX M1: 20% boost for touch devices (less precise input needs stronger attraction)
  // FIX: Increased desktop strength for more responsive physics
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window
  const baseStrength = 220
  const attractorStrength = isTouchDevice ? baseStrength * 0.8 : baseStrength
  
  useFrame((_state, delta) => {
    frameCount.current++

    if (isTouchDevice && frameCount.current % 2 === 0) {
      return
    }

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

    let targetPos: THREE.Vector3
    if (typeof targetPlaneZ === 'number') {
      const dz = dir.z
      if (Math.abs(dz) > 1e-4) {
        const tPlane = (targetPlaneZ - camera.position.z) / dz
        const tClamped = Math.min(Math.max(tPlane, 0), 200)
        targetPos = camera.position.clone().add(dir.clone().multiplyScalar(tClamped))
      } else {
        const distance = 15
        targetPos = camera.position.clone().add(dir.clone().multiplyScalar(distance))
        targetPos.z = targetPlaneZ
      }
    } else {
      const distance = 15
      targetPos = camera.position.clone().add(dir.clone().multiplyScalar(distance))
    }

    if (!attractorObject.current) return
    attractorObject.current.position.set(targetPos.x, targetPos.y, targetPos.z)

    const dt = Math.max(delta, 1 / 120)
    const isActiveMove = movementDelta >= MOVEMENT_THRESHOLD
    const speed = isActiveMove ? (movementDelta / dt) : 0
    const accel = isActiveMove ? ((speed - lastSpeed.current) / dt) : 0
    lastSpeed.current = isActiveMove ? speed : 0

    const smoothing = 1 - Math.exp(-dt * 12)
    smoothedSpeed.current = smoothedSpeed.current + (speed - smoothedSpeed.current) * smoothing
    smoothedAccel.current = smoothedAccel.current + (Math.abs(accel) - smoothedAccel.current) * smoothing

    // Speed- and acceleration-driven scaling.
    // This makes orbs follow smoothly at slow movement, and only ramp strongly when the cursor accelerates.
    const speedScale = Math.min(smoothedSpeed.current / speedFull, 1)
    const accelScale = Math.min(smoothedAccel.current / accelFull, 1)
    const movementScale = Math.min(1, speedScale * 0.7 + accelScale * 0.3)

    // Keep a stable baseline pull at rest so orbs stay clustered around the cursor.
    // Ramp up with speed/accel so fast swipes still feel more energetic.
    const baselineTarget = isActiveMove ? 1 : idleBaselineMultiplier
    const baselineSmoothing = 1 - Math.exp(-dt * 10)
    baselineMul.current = baselineMul.current + (baselineTarget - baselineMul.current) * baselineSmoothing

    const BASELINE = Math.min(1, Math.max(0, baselineStrength * baselineMul.current))
    const scaledStrength = attractorStrength * strengthScale * (BASELINE + (1 - BASELINE) * movementScale)

    const cohesionPull = attractorStrength * cohesionStrength
    let cohesionX = 0
    let cohesionY = 0
    let cohesionZ = 0
    let cohesionCount = 0

    if (cohesionPull > 0 && cohesionObject.current) {
      world.bodies.forEach((body: any) => {
        if (!body.isDynamic()) return
        const p = body.translation()
        cohesionX += p.x
        cohesionY += p.y
        cohesionZ += p.z
        cohesionCount++
      })
      if (cohesionCount > 0) {
        cohesionObject.current.position.set(
          cohesionX / cohesionCount,
          cohesionY / cohesionCount,
          cohesionZ / cohesionCount
        )
      }
    }

    const object = attractorObject.current

    world.bodies.forEach((body: any) => {
      if (!body.isDynamic()) return

      let perBodyStrength = scaledStrength
      if (softCoreRadius > 0) {
        const p = body.translation()
        const dx = p.x - object.position.x
        const dy = p.y - object.position.y
        const dxy = Math.sqrt(dx * dx + dy * dy)
        if (dxy < softCoreRadius) {
          const t = Math.min(Math.max(dxy / softCoreRadius, 0), 1)
          const smooth = t * t * (3 - 2 * t)
          const mul = 0.05 + 0.95 * smooth
          perBodyStrength = scaledStrength * mul
        }
      }

      applyAttractorForceOnRigidBody(body, {
        object,
        strength: perBodyStrength,
        range: attractorRange,
        type: 'linear',
        gravitationalConstant: 6.673e-11,
      })

      if (cohesionPull > 0 && cohesionObject.current) {
        applyAttractorForceOnRigidBody(body, {
          object: cohesionObject.current,
          strength: cohesionPull,
          range: attractorRange,
          type: 'linear',
          gravitationalConstant: 6.673e-11,
        })
      }
    })
  })
  
  return (
    <>
      <object3D ref={attractorObject} />
      <object3D ref={cohesionObject} />
    </>
  )
}

// Export memoized version to prevent re-renders
export const MouseAttraction = memo(MouseAttractionComponent)
