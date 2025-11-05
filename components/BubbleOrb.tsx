'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { MeshTransmissionMaterial, Text } from '@react-three/drei'
import * as THREE from 'three'
import type { Album } from '@/lib/supabase'
import type { DeviceTier } from '@/lib/device-detection'
import { getQualitySettings } from '@/lib/device-detection'
import { getAlbumCoverUrl } from '@/lib/supabase-images'
import { useSmartTexture } from '@/hooks/useSmartTexture'

/**
 * Normalize emissive intensity based on color brightness
 * Darker colors get higher emissive, lighter colors get lower
 * This ensures all orbs have similar perceived brightness
 */
function normalizeEmissiveIntensity(colorHex: string): number {
  // Convert hex to RGB
  const r = parseInt(colorHex.slice(1, 3), 16) / 255
  const g = parseInt(colorHex.slice(3, 5), 16) / 255
  const b = parseInt(colorHex.slice(5, 7), 16) / 255
  
  // Calculate perceived brightness (0-1)
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114)
  
  // Inverse relationship - darker colors need MORE emissive
  return brightness < 0.5 
    ? 3.5  // Dark colors: high emissive
    : 2.0  // Light colors: lower emissive
}

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
  const [hovered, setHovered] = useState(false)
  
  const quality = getQualitySettings(deviceTier)

  // Load texture with smart loader (tries multiple extensions)
  const possibleUrls = getAlbumCoverUrl(album.slug)
  const texture = useSmartTexture(possibleUrls, album.title)

  const seed = album.id.charCodeAt(0) * 137.5

  // Detect mobile for enhanced visuals
  const isMobile = deviceTier === 'low' || deviceTier === 'medium'

  // Use album's dominant color for glow, fallback to voltage blue
  const glowColor = album.palette?.dominant || album.palette?.accent1 || '#4F9EFF'
  const normalizedIntensity = normalizeEmissiveIntensity(glowColor)
  
  // Mobile gets brighter glow for better visibility
  const mobileIntensityBoost = isMobile ? 1.5 : 1.0

  useFrame((state) => {
    if (!ref.current) return

    const t = state.clock.elapsedTime
    const body = ref.current
    const pos = body.translation()

    // Perlin noise drift for organic motion
    const noiseX = Math.sin(t * 0.3 + seed) * 0.05
    const noiseY = Math.cos(t * 0.2 + seed * 0.7) * 0.05
    body.applyImpulse({ x: noiseX, y: noiseY, z: 0 }, true)

    // Mouse interaction field with proper 3D unprojection
    const vector = new THREE.Vector3(state.pointer.x, state.pointer.y, 0.5)
    vector.unproject(state.camera)
    const dir = vector.sub(state.camera.position).normalize()
    const mousePos = state.camera.position.clone().add(dir.multiplyScalar(20))
    
    const orbPos = new THREE.Vector3(pos.x, pos.y, pos.z)
    const distance = mousePos.distanceTo(orbPos)
    const toCursor = mousePos.clone().sub(orbPos)

    // Stronger attraction with larger range
    const tooClose = 2
    if (distance < tooClose) {
      // Repel when too close
      const repulsion = toCursor.clone().normalize().multiplyScalar(-0.2)
      body.applyImpulse(repulsion, true)
    } else if (distance < 8) {
      // Attract when in range (increased from 6 to 8)
      const strength = 0.15 * (1 - distance / 8)  // Increased from 0.12
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
      restitution={0.8}         // More bouncy
      friction={0.1}            // Less friction = more slippery
      linearDamping={0.2}       // Less damping = more responsive
      angularDamping={1.0}
      gravityScale={0}
      mass={radius * 0.5}       // LIGHTER = more responsive to forces
      ccd={true}                // Continuous collision detection
      position={position}
    >
      <group>
        {/* Inner glow with normalized brightness - BRIGHTER ON MOBILE */}
        <pointLight
          ref={glowRef}
          color={glowColor}
          intensity={(hovered ? normalizedIntensity * 2 : normalizedIntensity) * mobileIntensityBoost}
          distance={radius * (isMobile ? 6 : 5)}
        />

        {/* Outer glass shell - TINTED ON MOBILE */}
        <mesh
          onClick={() => {
            onNavigate(album.slug)
          }}
          onPointerEnter={() => {
            setHovered(true)
            onHover(album.title)
            document.body.style.cursor = 'pointer'
          }}
          onPointerLeave={() => {
            setHovered(false)
            onHover(null)
            document.body.style.cursor = 'default'
          }}
        >
          <sphereGeometry args={[radius, quality.sphereSegments, quality.sphereSegments]} />
          <MeshTransmissionMaterial
            transmission={isMobile ? 0.85 : 1}
            thickness={quality.thickness}
            roughness={quality.roughness}
            chromaticAberration={quality.chromaticAberration}
            anisotropicBlur={0.1}
            distortion={0.05}
            samples={quality.samples}
            toneMapped={false}
            color={isMobile ? glowColor : 'white'}
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
              emissiveIntensity={hovered ? normalizedIntensity * 1.5 : normalizedIntensity}
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
        
        {/* Text ON the orb - only when hovered */}
        {hovered && (
          <Text
            position={[0, 0, radius * 1.1]}  // Slightly in front of orb
            fontSize={radius * 0.3}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="black"
            outlineBlur={0.05}
          >
            {album.title}
          </Text>
        )}
      </group>
    </RigidBody>
  )
}
