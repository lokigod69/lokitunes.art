'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'
import type { Album } from '@/lib/supabase'
import type { DeviceTier } from '@/lib/device-detection'
import { getQualitySettings } from '@/lib/device-detection'
import { getAlbumCoverUrl } from '@/lib/supabase-images'
import { useSmartTexture } from '@/hooks/useSmartTexture'

interface BubbleOrbProps {
  album: Album
  position: [number, number, number]
  radius: number
  deviceTier: DeviceTier
  onHover: (title: string | null) => void
  onNavigate: (slug: string) => void
}


export function BubbleOrb({ 
  album, 
  position,
  radius,
  deviceTier,
  onHover, 
  onNavigate 
}: BubbleOrbProps) {
  const ref = useRef<RapierRigidBody>(null)
  const glowRef = useRef<THREE.PointLight>(null)
  const innerMeshRef = useRef<THREE.Mesh>(null)
  
  const quality = getQualitySettings(deviceTier)

  // Load texture with smart loader (tries multiple extensions)
  const possibleUrls = getAlbumCoverUrl(album.slug)
  const texture = useSmartTexture(possibleUrls, album.title)

  const seed = album.id.charCodeAt(0) * 137.5

  // Use album's dominant color for glow, fallback to voltage blue
  const glowColor = album.palette?.dominant || album.palette?.accent1 || '#4F9EFF'

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
      position={position}
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
        {/* Inner glow with album color palette - BRIGHTER */}
        <pointLight
          ref={glowRef}
          color={glowColor}
          intensity={5}
          distance={radius * 5}
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

        {/* Inner album art sphere - BIGGER and BRIGHTER */}
        {texture && (
          <mesh ref={innerMeshRef} scale={0.7}>
            <sphereGeometry 
              args={[
                radius, 
                Math.floor(quality.sphereSegments * 0.75), 
                Math.floor(quality.sphereSegments * 0.75)
              ]} 
            />
            <meshStandardMaterial 
              map={texture}
              emissive={glowColor}
              emissiveIntensity={2.5}
              toneMapped={false}
              dispose={null}
            />
          </mesh>
        )}

        {/* Fallback colored sphere if no texture - BIGGER */}
        {!texture && (
          <mesh scale={0.7}>
            <sphereGeometry 
              args={[
                radius, 
                Math.floor(quality.sphereSegments * 0.75), 
                Math.floor(quality.sphereSegments * 0.75)
              ]} 
            />
            <meshStandardMaterial 
              color={glowColor}
              emissive={glowColor}
              emissiveIntensity={1.5}
              toneMapped={false}
              dispose={null}
            />
          </mesh>
        )}
      </group>
    </RigidBody>
  )
}
