'use client'

import { useThree, useFrame } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'

/**
 * Mouse attraction component - DEBUG VERSION
 * Shows a RED SPHERE that follows your cursor
 * This helps verify the mouse tracking is working
 */
export function MouseAttraction() {
  const { camera, pointer } = useThree()
  const attractorRef = useRef<THREE.Mesh>(null)
  
  // Log on mount to verify component exists
  useEffect(() => {
    console.log('🎯 MouseAttraction component mounted!')
  }, [])
  
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
    
    // Project to a distance of 15 units from camera
    const distance = 15
    const cursorPos = camera.position.clone().add(dir.multiplyScalar(distance))
    
    // Update attractor position
    attractorRef.current.position.copy(cursorPos)
    
    // DEBUG: Log cursor position occasionally
    if (Math.random() < 0.016) {  // ~60fps = once per second
      console.log('🎯 Attractor position:', cursorPos.toArray())
      console.log('🖱️ Pointer:', pointer.x.toFixed(2), pointer.y.toFixed(2))
    }
  })
  
  return (
    <>
      {/* VISIBLE RED SPHERE - You should SEE this following your mouse! */}
      <mesh ref={attractorRef}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="red" wireframe />
      </mesh>
    </>
  )
}
