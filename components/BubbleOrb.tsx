'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'
import type { Album } from '@/lib/supabase'
import type { DeviceTier } from '@/lib/device-detection'
import { getQualitySettings } from '@/lib/device-detection'

interface BubbleOrbProps {
  album: Album
  index: number
  totalCount: number
  deviceTier: DeviceTier
  onHover: (title: string | null) => void
  onNavigate: (slug: string) => void
}

function calculateRadius(versionCount: number): number {
  const base = 1.5
  const raw = base + 0.4 * Math.sqrt(versionCount)
  const clamped = THREE.MathUtils.clamp(raw, 1.2, 3.0)
  return clamped * (1 + (Math.random() - 0.5) * 0.16)
}

export function BubbleOrb({ 
  album, 
  index, 
  totalCount, 
  deviceTier,
  onHover, 
  onNavigate 
}: BubbleOrbProps) {
  const ref = useRef<RapierRigidBody>(null)
  const glowRef = useRef<THREE.PointLight>(null)
  const innerMeshRef = useRef<THREE.Mesh>(null)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  
  const quality = getQualitySettings(deviceTier)
  
  // Load texture with proper CORS and color space handling
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
      // CRITICAL: Set color space BEFORE needsUpdate to prevent black textures
      newTexture.colorSpace = THREE.SRGBColorSpace
      newTexture.needsUpdate = true
      setTexture(newTexture)
      console.log('✅ Texture loaded:', album.title, album.cover_url)
    }
    
    img.onerror = (err) => {
      console.error('❌ Texture failed:', album.title, album.cover_url, err)
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      if (texture) {
        texture.dispose()
      }
    }
  }, [album.cover_url, album.title])

  const radius = calculateRadius(album.total_versions || 1)
  const seed = index * 137.5

  const accentColor = album.palette?.accent1 || '#4F9EFF'

  useFrame((state) => {
    if (!ref.current) return

    const t = state.clock.elapsedTime
    const body = ref.current
    const pos = body.translation()

    // Perlin noise drift for organic motion
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

    const tooClose = 2
    if (distance < tooClose) {
      const repulsion = toCursor.clone().normalize().multiplyScalar(-0.15)
      body.applyImpulse(repulsion, true)
    } else if (distance < 6) {
      const strength = 0.12 * (1 - distance / 6)
      const attraction = toCursor.normalize().multiplyScalar(strength)
      body.applyImpulse(attraction, true)
    }

    // Glow pulse
    if (glowRef.current) {
      glowRef.current.intensity = 0.8 + Math.sin(t * 0.7) * 0.2
    }

    // Gentle rotation for inner sphere
    if (innerMeshRef.current) {
      innerMeshRef.current.rotation.y = t * 0.1
    }
  })

  // Calculate grid position
  const cols = Math.ceil(Math.sqrt(totalCount))
  const row = Math.floor(index / cols)
  const col = index % cols
  
  const spacing = 3
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
      linearDamping={0.3}
      angularDamping={1.0}
      gravityScale={0}
      mass={radius}
      position={initialPosition}
    >
      <group
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
        {/* Inner glow */}
        <pointLight
          ref={glowRef}
          color={accentColor}
          intensity={1}
          distance={radius * 2}
        />

        {/* Outer glass shell */}
        <mesh>
          <sphereGeometry args={[radius, quality.sphereSegments, quality.sphereSegments]} />
          <MeshTransmissionMaterial
            transmission={1}
            thickness={quality.thickness}
            roughness={quality.roughness}
            chromaticAberration={quality.chromaticAberration}
            anisotropicBlur={0.1}
            distortion={0.05}
            samples={quality.samples}
            toneMapped={false}
          />
        </mesh>

        {/* Inner album art sphere */}
        {texture && (
          <mesh ref={innerMeshRef} scale={0.85}>
            <sphereGeometry 
              args={[
                radius, 
                Math.floor(quality.sphereSegments * 0.75), 
                Math.floor(quality.sphereSegments * 0.75)
              ]} 
            />
            <meshStandardMaterial 
              map={texture}
              emissive={accentColor}
              emissiveIntensity={1.5}
              toneMapped={false}
              dispose={null}
            />
          </mesh>
        )}

        {/* Fallback colored sphere if no texture */}
        {!texture && (
          <mesh scale={0.85}>
            <sphereGeometry 
              args={[
                radius, 
                Math.floor(quality.sphereSegments * 0.75), 
                Math.floor(quality.sphereSegments * 0.75)
              ]} 
            />
            <meshStandardMaterial 
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={0.8}
              toneMapped={false}
              dispose={null}
            />
          </mesh>
        )}
      </group>
    </RigidBody>
  )
}
