'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import type { Album } from '@/lib/supabase'

interface OrbProps {
  album: Album
  index: number
  totalCount: number
  onHover: (title: string | null) => void
  onNavigate: (slug: string) => void
}

function calculateRadius(versionCount: number): number {
  const base = 1.5  // Increased from 1.2
  const raw = base + 0.4 * Math.sqrt(versionCount)  // Increased multiplier
  const clamped = THREE.MathUtils.clamp(raw, 1.2, 3.0)  // Bigger min/max
  return clamped * (1 + (Math.random() - 0.5) * 0.16)
}

export function SonicOrb({ album, index, totalCount, onHover, onNavigate }: OrbProps) {
  const ref = useRef<RapierRigidBody>(null)
  const glowRef = useRef<THREE.PointLight>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  
  // CRITICAL FIX: Load texture with proper CORS handling using Image element
  useEffect(() => {
    if (!album.cover_url) {
      console.warn(`⚠️ No cover URL for ${album.title}`)
      return
    }
    
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = album.cover_url
    
    img.onload = () => {
      const newTexture = new THREE.Texture(img)
      newTexture.needsUpdate = true
      newTexture.colorSpace = THREE.SRGBColorSpace
      setTexture(newTexture)
      console.log('✅ Texture loaded:', album.title, album.cover_url)
    }
    
    img.onerror = (err) => {
      console.error('❌ Texture failed:', album.title, album.cover_url, err)
    }
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

  // Calculate grid position to keep all orbs visible
  const cols = Math.ceil(Math.sqrt(totalCount))
  const row = Math.floor(index / cols)
  const col = index % cols
  
  const spacing = 3  // Distance between orbs
  const gridWidth = (cols - 1) * spacing
  const gridHeight = (Math.ceil(totalCount / cols) - 1) * spacing
  const startX = -gridWidth / 2
  const startY = gridHeight / 2
  
  const initialPosition: [number, number, number] = [
    startX + col * spacing,
    startY - row * spacing,
    0
  ]

  return (
    <RigidBody
      ref={ref}
      colliders="ball"
      restitution={0.7}
      friction={0.2}
      linearDamping={0.2}
      angularDamping={0.3}
      position={initialPosition}
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
          {texture ? (
            <meshStandardMaterial
              map={texture}
              metalness={0.3}
              roughness={0.6}
              envMapIntensity={0.5}
            />
          ) : (
            <meshStandardMaterial
              color={accentColor}
              metalness={0.5}
              roughness={0.5}
            />
          )}
        </mesh>
      </group>
    </RigidBody>
  )
}
