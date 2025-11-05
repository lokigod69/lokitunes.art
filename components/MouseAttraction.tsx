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
  const coreRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  
  // Log on mount to verify component exists
  useEffect(() => {
    console.log('🎯 MouseAttraction component mounted!')
  }, [])
  
  useFrame((state) => {
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
    
    // PULSING ANIMATION
    const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.2 + 1
    attractorRef.current.scale.setScalar(pulse)
    
    if (coreRef.current) {
      coreRef.current.position.copy(cursorPos)
      coreRef.current.scale.setScalar(pulse * 1.5)
    }
    
    // Pulsing light intensity
    if (lightRef.current) {
      lightRef.current.position.copy(cursorPos)
      lightRef.current.intensity = 2 + Math.sin(state.clock.elapsedTime * 3) * 1
    }
    
    // DEBUG: Log cursor position occasionally
    if (Math.random() < 0.016) {  // ~60fps = once per second
      console.log('🎯 Attractor position:', cursorPos.toArray())
      console.log('🖱️ Pointer:', pointer.x.toFixed(2), pointer.y.toFixed(2))
    }
  })
  
  return (
    <>
      {/* ENHANCED RED TRACKING SPHERE - Cyberpunk aesthetic! */}
      <mesh ref={attractorRef}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial 
          color="#ff0000" 
          wireframe 
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Middle cyan ring - rotates */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[0.6, 0.05, 16, 32]} />
        <meshBasicMaterial color="#00ffff" wireframe />
      </mesh>
      
      {/* Glowing red core - pulsing */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      
      {/* Point light at cursor - pulsing intensity */}
      <pointLight 
        ref={lightRef}
        color="#ff0000" 
        intensity={2}
        distance={5}
      />
    </>
  )
}
