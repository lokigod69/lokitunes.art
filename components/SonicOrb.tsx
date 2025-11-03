'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { Album } from '@/lib/supabase'

interface OrbProps {
  album: Album
  index: number
  onHover: (title: string | null) => void
  onNavigate: (slug: string) => void
}

function calculateRadius(versionCount: number): number {
  const base = 1.2
  const raw = base + 0.3 * Math.sqrt(versionCount)
  const clamped = THREE.MathUtils.clamp(raw, 0.9, 2.8)
  return clamped * (1 + (Math.random() - 0.5) * 0.16)
}

export function SonicOrb({ album, index, onHover, onNavigate }: OrbProps) {
  const ref = useRef<RapierRigidBody>(null)
  const glowRef = useRef<THREE.PointLight>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Load texture with error handling
  let texture: THREE.Texture | null = null
  try {
    texture = useTexture(album.cover_url || '/placeholder-album.jpg')
  } catch (error) {
    console.warn('Failed to load texture for', album.title)
  }

  const radius = calculateRadius(album.total_versions || 1)
  const seed = index * 137.5 // golden angle for distribution

  const accentColor = album.palette?.accent1 || '#4F9EFF'

  useFrame((state) => {
    if (!ref.current) return

    const t = state.clock.elapsedTime
    const body = ref.current
    const pos = body.translation()

    // Perlin noise drift (simplified)
    const noiseX = Math.sin(t * 0.3 + seed) * 0.02
    const noiseY = Math.cos(t * 0.2 + seed * 0.7) * 0.02
    body.applyImpulse({ x: noiseX, y: noiseY, z: 0 }, true)

    // Mouse attraction field
    const mouse = new THREE.Vector3(
      state.pointer.x * 5,
      state.pointer.y * 3,
      0
    )
    const distance = mouse.distanceTo(new THREE.Vector3(pos.x, pos.y, pos.z))

    if (distance < 4) {
      const direction = mouse.clone().sub(new THREE.Vector3(pos.x, pos.y, pos.z))
      direction.normalize().multiplyScalar(0.02 * (1 - distance / 4))
      body.applyImpulse(direction, true)
    }

    // Glow pulse
    if (glowRef.current) {
      glowRef.current.intensity = 0.8 + Math.sin(t * 0.7) * 0.2
    }

    // Gentle rotation
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.1
    }
  })

  return (
    <RigidBody
      ref={ref}
      colliders="ball"
      restitution={0.7}
      friction={0.2}
      linearDamping={0.5}
      position={[
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 2,
      ]}
    >
      <group>
        {/* Inner glow */}
        <pointLight
          ref={glowRef}
          color={accentColor}
          intensity={1}
          distance={radius * 2}
        />

        {/* Orb mesh */}
        <mesh
          ref={meshRef}
          onClick={() => onNavigate(album.slug)}
          onPointerEnter={() => {
            onHover(album.title)
            document.body.style.cursor = 'pointer'
          }}
          onPointerLeave={() => {
            onHover(null)
            document.body.style.cursor = 'default'
          }}
        >
          <sphereGeometry args={[radius, 64, 64]} />
          <meshPhysicalMaterial
            map={texture}
            transmission={0.9}
            roughness={0.1}
            thickness={0.5}
            iridescence={0.6}
            iridescenceIOR={1.3}
            envMapIntensity={2}
          />
        </mesh>
      </group>
    </RigidBody>
  )
}
