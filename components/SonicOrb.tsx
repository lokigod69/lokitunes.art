'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, type RapierRigidBody } from '@react-three/rapier'
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
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  
  // Load texture properly with error handling
  useEffect(() => {
    if (!album.cover_url) return
    
    const loader = new THREE.TextureLoader()
    loader.load(
      album.cover_url,
      (loadedTexture) => {
        loadedTexture.wrapS = THREE.RepeatWrapping
        loadedTexture.wrapT = THREE.RepeatWrapping
        loadedTexture.colorSpace = THREE.SRGBColorSpace
        setTexture(loadedTexture)
        console.log(`✅ Loaded texture for ${album.title}`)
      },
      undefined,
      (error) => {
        console.error(`❌ Failed to load texture for ${album.title}:`, error)
      }
    )
  }, [album.cover_url, album.title])

  const radius = calculateRadius(album.total_versions || 1)
  const seed = index * 137.5 // golden angle for distribution

  const accentColor = album.palette?.accent1 || '#4F9EFF'

  useFrame((state) => {
    if (!ref.current) return

    const t = state.clock.elapsedTime
    const body = ref.current
    const pos = body.translation()

    // Perlin noise drift (increased for more motion)
    const noiseX = Math.sin(t * 0.3 + seed) * 0.05
    const noiseY = Math.cos(t * 0.2 + seed * 0.7) * 0.05
    body.applyImpulse({ x: noiseX, y: noiseY, z: 0 }, true)

    // Mouse interaction field (repulsion when too close, attraction when near)
    const mouse = new THREE.Vector3(
      state.pointer.x * 5,
      state.pointer.y * 3,
      0
    )
    const orbPos = new THREE.Vector3(pos.x, pos.y, pos.z)
    const distance = mouse.distanceTo(orbPos)
    const toCursor = mouse.clone().sub(orbPos)

    const tooClose = 2  // Personal space radius
    if (distance < tooClose) {
      // Push away from cursor when too close
      const repulsion = toCursor.clone().normalize().multiplyScalar(-0.15)
      body.applyImpulse(repulsion, true)
    } else if (distance < 6) {
      // Normal attraction when not too close
      const strength = 0.12 * (1 - distance / 6)
      const attraction = toCursor.normalize().multiplyScalar(strength)
      body.applyImpulse(attraction, true)
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
      linearDamping={0.2}
      angularDamping={0.3}
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
            metalness={0.8}
            roughness={0.2}
            transmission={0}
            clearcoat={0.7}
            clearcoatRoughness={0.1}
            envMapIntensity={1.5}
            iridescence={0.4}
            iridescenceIOR={1.3}
          />
        </mesh>
      </group>
    </RigidBody>
  )
}
