'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { MeshTransmissionMaterial, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { SongVersion } from '@/lib/supabase'
import type { DeviceTier } from '@/lib/device-detection'
import { getQualitySettings } from '@/lib/device-detection'
import { useSmartTexture } from '@/hooks/useSmartTexture'
import { useAudioStore } from '@/lib/audio-store'

/**
 * Extended version with song context for orb display
 */
export interface ExtendedVersion extends SongVersion {
  songTitle: string
  songId: string
  trackNo: number | null
}

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

interface VersionOrbProps {
  version: ExtendedVersion
  position: [number, number, number]
  radius: number
  deviceTier: DeviceTier
  albumPalette: {
    dominant: string
    accent1: string
    accent2: string
  } | null
  albumCoverUrl: string
  onHover: (label: string | null) => void
}

export function VersionOrb({ 
  version, 
  position,
  radius,
  deviceTier,
  albumPalette,
  albumCoverUrl,
  onHover
}: VersionOrbProps) {
  const ref = useRef<RapierRigidBody>(null)
  const glowRef = useRef<THREE.PointLight>(null)
  const innerMeshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  
  // Audio store integration
  const { currentVersion, isPlaying, play } = useAudioStore()
  const isThisPlaying = currentVersion?.id === version.id && isPlaying
  
  const quality = getQualitySettings(deviceTier)

  // Load texture - use version cover or fallback to album cover
  const coverUrl = version.cover_url || albumCoverUrl
  const possibleUrls = coverUrl ? [coverUrl] : []
  console.log(`🔍 Loading texture for ${version.label}:`, coverUrl || 'no cover')
  const texture = useSmartTexture(possibleUrls, version.label)

  // Configure texture for maximum sharpness
  useEffect(() => {
    if (texture) {
      console.log(`✅ Texture loaded for ${version.label}:`, texture)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.anisotropy = 16
      texture.needsUpdate = true
    } else {
      console.log(`❌ NO texture for ${version.label} - using fallback color`)
    }
  }, [texture, version.label])

  const seed = version.id.charCodeAt(0) * 137.5

  // Detect mobile for enhanced visuals
  const isMobile = deviceTier === 'low' || deviceTier === 'medium'

  // Use album's dominant color for glow, fallback to voltage blue
  // Palette colors are now cleaned at the source (queries.ts)
  const glowColor = albumPalette?.dominant || albumPalette?.accent1 || '#4F9EFF'
  
  const normalizedIntensity = normalizeEmissiveIntensity(glowColor)
  
  // Mobile gets brighter glow for better visibility
  const mobileIntensityBoost = isMobile ? 1.5 : 1.0

  useFrame((state) => {
    if (!ref.current) return

    const t = state.clock.elapsedTime
    const body = ref.current
    const pos = body.translation()

    // ONLY apply physics if NOT playing (when playing, orb is frozen)
    if (!isThisPlaying) {
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
        // Attract when in range
        const strength = 0.15 * (1 - distance / 8)
        const attraction = toCursor.normalize().multiplyScalar(strength)
        body.applyImpulse(attraction, true)
      }
    }

    // PULSING GLOW - Enhanced when playing
    if (glowRef.current) {
      if (isThisPlaying) {
        // PLAYING ORB: Faster, brighter pulse
        const pulse = Math.sin(t * 2) * 0.5 + 1.5
        glowRef.current.intensity = normalizedIntensity * pulse * 1.5
      } else {
        // NORMAL ORB: Gentle pulse
        const pulse = Math.sin(t * 1.5) * 0.5 + 1.5
        glowRef.current.intensity = normalizedIntensity * pulse
      }
    }

    // Gentle rotation for inner sphere
    if (innerMeshRef.current) {
      innerMeshRef.current.rotation.y = t * 0.1
    }
  })

  const handleClick = () => {
    console.log('🎮 Version orb clicked:', version.label)
    console.log('   Version ID:', version.id)
    console.log('   Song ID:', version.songId)
    console.log('   Audio URL:', version.audio_url)
    
    // Play this version with album palette for themed player
    play(version, version.songId, albumPalette)
  }

  return (
    <RigidBody
      ref={ref}
      type={isThisPlaying ? 'fixed' : 'dynamic'}  // FREEZE when playing!
      colliders="ball"
      restitution={0.8}
      friction={0.1}
      linearDamping={0.05}
      angularDamping={0.5}
      gravityScale={0}
      mass={radius * 0.5}
      ccd={true}
      position={position}
    >
      <group>
        {/* Inner glow - PULSING (enhanced when playing) */}
        <pointLight
          ref={glowRef}
          color={(glowColor || '#4F9EFF').slice(0, 7)}
          intensity={normalizedIntensity * 0.2}  // 🎨 OPTION C: Maximum texture visibility
          distance={radius * 5}
        />

        {/* Outer glass shell - BARELY THERE */}
        <mesh
          onClick={handleClick}
          onPointerEnter={() => {
            setHovered(true)
            onHover(version.label)
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
            transmission={0.98}
            thickness={0.08}
            roughness={0.2}
            chromaticAberration={0}
            anisotropicBlur={0}
            distortion={0}
            samples={quality.samples}
            toneMapped={false}
            color="white"
            opacity={0.12}
          />
        </mesh>

        {/* Inner cover art sphere - BRIGHT (extra bright when playing) */}
        {/* ═══════════════════════════════════════════════════════════════════════════════
            🎨 TEXTURE VISIBILITY OPTIONS - Easy to switch!
            ═══════════════════════════════════════════════════════════════════════════════
            CURRENT: Option C (Maximum Visibility - 90% visibility)
            
            To switch options, change the 3 values marked with 🎨:
            
            Option A (Subtle - 60% visibility, strong glass):
              emissiveIntensity: playing ? 3.0 : hovered ? 2.0 : 1.5
              roughness: 0.3
              pointLight intensity: normalizedIntensity * 0.5
            
            Option B (Balanced - 75% visibility, balanced glass):
              emissiveIntensity: playing ? 2.0 : hovered ? 1.5 : 1.0
              roughness: 0.5
              pointLight intensity: normalizedIntensity * 0.3
            
            Option C (Maximum - 90% visibility, subtle glass):
              emissiveIntensity: playing ? 1.5 : hovered ? 1.0 : 0.5
              roughness: 0.7
              pointLight intensity: normalizedIntensity * 0.2
            
            Option ORIGINAL (Current production):
              emissiveIntensity: playing ? 6.0 : hovered ? 4.0 : 3.0
              roughness: 0.1
              pointLight intensity: normalizedIntensity * 1.0
            ═══════════════════════════════════════════════════════════════════════════════ */}
        {texture && (
          <mesh ref={innerMeshRef} scale={0.95} onClick={handleClick}>
            <sphereGeometry 
              args={[
                radius, 
                Math.floor(quality.sphereSegments * 0.75), 
                Math.floor(quality.sphereSegments * 0.75)
              ]} 
            />
            <meshStandardMaterial
              map={texture}
              emissive={(glowColor || '#4F9EFF').slice(0, 7)}
              emissiveIntensity={isThisPlaying ? 1.5 : (hovered ? 1.0 : 0.5)}  // 🎨 OPTION C: Maximum texture visibility
              metalness={0.3}
              roughness={0.7}  // 🎨 OPTION C: More diffuse for better texture detail
              toneMapped={false}
              dispose={null}
            />
          </mesh>
        )}

        {/* Fallback colored sphere if no texture */}
        {!texture && (
          <mesh scale={0.7} onClick={handleClick}>
            <sphereGeometry 
              args={[
                radius, 
                Math.floor(quality.sphereSegments * 0.75), 
                Math.floor(quality.sphereSegments * 0.75)
              ]} 
            />
            <meshStandardMaterial 
              color={(glowColor || '#4F9EFF').slice(0, 7)}
              emissive={(glowColor || '#4F9EFF').slice(0, 7)}
              emissiveIntensity={isThisPlaying ? 2.5 : 1.5}
              toneMapped={false}
              dispose={null}
            />
          </mesh>
        )}
        
        {/* HTML label overlay - always faces camera (readable from any angle) */}
        {(hovered || isThisPlaying) && (
          <Html
            position={[0, radius * 0.7, 0]}
            center
            distanceFactor={12}
            zIndexRange={[0, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <div
              className={`px-6 py-3 backdrop-blur-lg rounded-full border shadow-lg transition-colors ${
                isThisPlaying
                  ? 'bg-voltage/20 border-voltage'
                  : 'bg-void/90 border-voltage/30'
              }`}
            >
              <p
                className={`text-xl font-bold whitespace-nowrap ${
                  isThisPlaying ? 'text-voltage' : 'text-bone'
                }`}
              >
                {isThisPlaying ? '♪ ' : ''}{version.label}
              </p>
            </div>
          </Html>
        )}
      </group>
    </RigidBody>
  )
}
