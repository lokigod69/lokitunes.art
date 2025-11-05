'use client'

import { useThree, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'

/**
 * Mouse attraction component that creates a physics attractor at cursor position
 * Orbs will be attracted toward the mouse cursor
 */
export function MouseAttraction() {
  const { camera, pointer } = useThree()
  const attractorRef = useRef<THREE.Group>(null)
  
  useFrame(() => {
    if (!attractorRef.current) return
    
    // Convert screen coordinates to 3D world position
    const vector = new THREE.Vector3(
      pointer.x,
      pointer.y,
      0.5  // Z-depth in normalized device coordinates
    )
    
    // Unproject through camera to get world position
    vector.unproject(camera)
    
    // Calculate direction from camera to cursor
    const dir = vector.sub(camera.position).normalize()
    
    // Project to a distance of 20 units from camera
    const distance = 20
    const cursorPos = camera.position.clone().add(dir.multiplyScalar(distance))
    
    // Update attractor position
    attractorRef.current.position.copy(cursorPos)
    
    // DEBUG: Log cursor position occasionally
    if (Math.random() < 0.016) {  // ~60fps = once per second
      console.log('🎯 Cursor world position:', cursorPos.toArray())
    }
  })
  
  return (
    <group ref={attractorRef}>
      {/* Invisible attractor sphere - orbs will be attracted to this */}
      <RigidBody
        type="kinematicPosition"
        colliders="ball"
        sensor
        gravityScale={0}
      >
        <mesh visible={false}>
          <sphereGeometry args={[2, 16, 16]} />
        </mesh>
      </RigidBody>
    </group>
  )
}
