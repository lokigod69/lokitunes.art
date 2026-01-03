/**
 * Game Obstacle
 * Rainbow-cycling wireframe cubes that move toward the camera and push orbs
 * Uses kinematicVelocity for proper collision impulse generation
 */
'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, BallCollider, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { usePlayMode } from '@/hooks/usePlayMode'

interface GameObstacleProps {
  id: string
  initialPosition: [number, number, number]
  size: number
  hueOffset: number  // Offset for rainbow cycling so each obstacle has different color
}

export function GameObstacle({ id, initialPosition, size, hueOffset }: GameObstacleProps) {
  const { isActive, isPaused, obstacleSpeed, runEndsAt, finishRun, incrementScore } = usePlayMode()
  const meshRef = useRef<THREE.Mesh>(null)
  const bodyRef = useRef<RapierRigidBody>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  const [currentHue, setCurrentHue] = useState(hueOffset)
  const hitAnyOrbRef = useRef(false)

  const OBSTACLE_Y_MIN = -15
  const OBSTACLE_Y_MAX = 10
  
  useFrame((state, delta) => {
    if (!isActive || isPaused || !meshRef.current || !bodyRef.current) return

    if (runEndsAt && Date.now() >= runEndsAt) {
      finishRun()
      return
    }
    
    // Rainbow color cycling
    const newHue = (currentHue + delta * 0.15) % 1
    setCurrentHue(newHue)
    const color = new THREE.Color().setHSL(newHue, 0.9, 0.55)
    
    if (materialRef.current) {
      materialRef.current.color = color
    }
    
    // Rotate like original PulsingWireframe
    meshRef.current.rotation.x += delta * 0.8
    meshRef.current.rotation.y += delta * 1.1
    
    // Use velocity for movement (kinematicVelocity generates collision impulses)
    const forwardSpeed = obstacleSpeed * 30
    bodyRef.current.setLinvel({ x: 0, y: 0, z: forwardSpeed }, true)
    
    // Check if passed the orb plane and needs recycling
    const pos = bodyRef.current.translation()
    if (pos.z > 10) {
      if (!hitAnyOrbRef.current) {
        incrementScore()
      }

      hitAnyOrbRef.current = false
      // Reset to back with new random position
      bodyRef.current.setTranslation({ 
        x: (Math.random() - 0.5) * 30, 
        y: OBSTACLE_Y_MIN + Math.random() * (OBSTACLE_Y_MAX - OBSTACLE_Y_MIN),
        z: -40 - Math.random() * 15
      }, true)
    }
  })
  
  if (!isActive) return null
  
  return (
    <RigidBody
      ref={bodyRef}
      position={initialPosition}
      type="kinematicVelocity"
      colliders={false}
      name={`obstacle-${id}`}
      onCollisionEnter={({ other }) => {
        const otherName = other.rigidBodyObject?.name || ''
        if (otherName.startsWith('orb-')) {
          hitAnyOrbRef.current = true
        }
      }}
    >
      {/* Sphere collider for smoother physics interactions */}
      <BallCollider args={[size * 0.8]} restitution={1.5} friction={0.1} />
      
      {/* Wireframe cube visual - matches PulsingWireframe style */}
      <mesh ref={meshRef}>
        <boxGeometry args={[size * 1.5, size * 1.5, size * 1.5]} />
        <meshBasicMaterial 
          ref={materialRef}
          wireframe
          transparent
          opacity={0.8}
          color={new THREE.Color().setHSL(hueOffset, 0.9, 0.55)}
        />
      </mesh>
      
      {/* Inner glow */}
      <pointLight 
        color={new THREE.Color().setHSL(hueOffset, 0.9, 0.55)} 
        intensity={3} 
        distance={size * 6} 
      />
    </RigidBody>
  )
}
