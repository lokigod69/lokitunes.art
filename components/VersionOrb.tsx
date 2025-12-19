'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'
import type { SongVersion } from '@/lib/supabase'
import type { DeviceTier } from '@/lib/device-detection'
import { getQualitySettings } from '@/lib/device-detection'
import { useSmartTexture } from '@/hooks/useSmartTexture'
import { useAudioStore } from '@/lib/audio-store'

/**
 * Extended version with song and album context for orb display
 */
export interface ExtendedVersion extends SongVersion {
  songTitle: string
  songId: string
  trackNo: number | null
  albumTitle?: string
  albumSlug?: string
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

// Animation states for orb docking
type OrbAnimationState = 'idle' | 'docking' | 'docked' | 'undocking'

// Easing function for smooth animations
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// Linear interpolation
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// Position interpolation
function lerpPosition(
  from: [number, number, number],
  to: [number, number, number],
  t: number
): [number, number, number] {
  return [
    lerp(from[0], to[0], t),
    lerp(from[1], to[1], t),
    lerp(from[2], to[2], t),
  ]
}

interface VersionOrbProps {
  version: ExtendedVersion
  allVersions: ExtendedVersion[]
  position: [number, number, number]
  radius: number
  orbCount?: number
  deviceTier: DeviceTier
  albumPalette: {
    dominant: string
    accent1: string
    accent2: string
  } | null
  albumCoverUrl: string
  onHover: (version: ExtendedVersion | null) => void
  // Docking system props
  vinylCenterPosition?: [number, number, number]
  onVinylRelease?: () => void
  isVinylVisible?: boolean
}

export function VersionOrb({ 
  version,
  allVersions,
  position,
  radius,
  orbCount,
  deviceTier,
  albumPalette,
  albumCoverUrl,
  onHover,
  vinylCenterPosition = [0, 0, -35],
  onVinylRelease,
  isVinylVisible = false
}: VersionOrbProps) {
  const ref = useRef<RapierRigidBody>(null)
  const glowRef = useRef<THREE.PointLight>(null)
  const innerMeshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const lastClickRef = useRef(0)
  const [hovered, setHovered] = useState(false)
  
  // Audio store integration
  const { currentVersion, isPlaying, play, stop, autoplayMode, startAlbumQueue, startGlobalQueue, setCurrentTime } = useAudioStore()
  const isThisPlaying = currentVersion?.id === version.id && isPlaying
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // 🎯 DOCKING ANIMATION STATE
  // ═══════════════════════════════════════════════════════════════════════════════
  const [animationState, setAnimationState] = useState<OrbAnimationState>('idle')
  const animationProgress = useRef(0)
  const originalPosition = useRef<[number, number, number]>(position)
  const currentAnimatedPosition = useRef<[number, number, number]>(position)
  const currentScale = useRef(1)
  
  // Animation constants
  const DOCK_ANIMATION_SPEED = 1.5  // Higher = faster animation
  const DOCKED_SCALE = 0.2          // How small the orb gets when docked (20% of original)
  const DOCKED_POSITION_OFFSET: [number, number, number] = [0, 0, 1]  // Slight offset in front of vinyl
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // 🎯 SYNC ANIMATION STATE WITH AUDIO STATE
  // When another orb starts playing, this orb should undock
  // Also handles edge cases to prevent stuck orbs
  // ═══════════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    // AUTO-DOCK: If this orb is idle but is the currently playing track (navigated back to page)
    if (animationState === 'idle' && isThisPlaying) {
      console.log('🎯 Auto-docking: This track is playing, docking orb:', version.label)
      // Capture current position before docking
      if (ref.current) {
        const pos = ref.current.translation()
        originalPosition.current = [pos.x, pos.y, pos.z]
      }
      animationProgress.current = 0
      setAnimationState('docking')
    }
    
    // If this orb was docked/docking but is no longer playing (another orb took over)
    if ((animationState === 'docked' || animationState === 'docking') && !isThisPlaying) {
      console.log('🔄 Another orb started playing, undocking:', version.label)
      // Reset originalPosition to initial spawn position (ensures orb returns to valid location)
      originalPosition.current = position
      setAnimationState('undocking')
    }
    
    // Safety: If orb is undocking but somehow isThisPlaying becomes true, reset to docking
    if (animationState === 'undocking' && isThisPlaying) {
      console.log('🔄 Orb clicked while undocking, re-docking:', version.label)
      setAnimationState('docking')
    }
  }, [isThisPlaying, animationState, version.label, position])
  
  // Safety reset: If orb gets stuck in a non-idle state while not playing, force reset after 3s
  useEffect(() => {
    // Only set timer if we're in an animation state but not actually playing
    if (animationState !== 'idle' && !isThisPlaying) {
      const safetyTimer = setTimeout(() => {
        // Force reset to idle - the closure captured animationState !== 'idle'
        console.log('⚠️ Safety reset: Orb stuck, forcing idle:', version.label)
        setAnimationState('idle')
        animationProgress.current = 0
        currentScale.current = 1
        if (groupRef.current) {
          groupRef.current.scale.setScalar(1)
        }
      }, 3000)
      return () => clearTimeout(safetyTimer)
    }
  }, [animationState, isThisPlaying, version.label])
  
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
  const mobileIntensityBoost = isMobile ? 1.2 : 1.0

  // Count-based physics tweak: small albums (≤5 orbs) get reduced damping for more lively motion
  const effectiveOrbCount = orbCount ?? 10
  const speedBoostFactor = effectiveOrbCount <= 5 ? 0.4 : 1.0
  const adjustedLinearDamping = 0.05 * speedBoostFactor

  // ✅ FIX 3: Add random initial velocity for immediate motion on load
  useEffect(() => {
    if (!ref.current) return
    
    // Small delay to let physics world initialize
    const timer = setTimeout(() => {
      if (!ref.current) return
      
      const randomImpulse = {
        x: (Math.random() - 0.5) * 0.8,
        y: (Math.random() - 0.5) * 0.8,
        z: (Math.random() - 0.5) * 0.3,
      }
      
      ref.current.applyImpulse(randomImpulse, true)
    }, 100) // 100ms delay for physics world stabilization
    
    return () => clearTimeout(timer)
  }, [])

  // Calculate the target docked position (center of vinyl, slightly in front)
  const dockedPosition: [number, number, number] = [
    vinylCenterPosition[0] + DOCKED_POSITION_OFFSET[0],
    vinylCenterPosition[1] + DOCKED_POSITION_OFFSET[1],
    vinylCenterPosition[2] + DOCKED_POSITION_OFFSET[2],
  ]

  useFrame((state, delta) => {
    if (!ref.current) return

    const t = state.clock.elapsedTime
    const body = ref.current
    const pos = body.translation()

    // ═══════════════════════════════════════════════════════════════════════════════
    // 🎯 DOCKING ANIMATION LOGIC
    // ═══════════════════════════════════════════════════════════════════════════════
    
    if (animationState === 'docking') {
      // Animate toward vinyl center
      animationProgress.current = Math.min(1, animationProgress.current + delta * DOCK_ANIMATION_SPEED)
      const easedProgress = easeInOutCubic(animationProgress.current)
      
      // Interpolate position: originalPosition → dockedPosition
      currentAnimatedPosition.current = lerpPosition(
        originalPosition.current,
        dockedPosition,
        easedProgress
      )
      
      // Interpolate scale: 1 → DOCKED_SCALE
      currentScale.current = lerp(1, DOCKED_SCALE, easedProgress)
      
      // Move the rigid body to the animated position
      body.setTranslation({
        x: currentAnimatedPosition.current[0],
        y: currentAnimatedPosition.current[1],
        z: currentAnimatedPosition.current[2],
      }, true)
      
      // Update visual scale
      if (groupRef.current) {
        groupRef.current.scale.setScalar(currentScale.current)
      }
      
      // When animation complete, switch to docked state
      if (animationProgress.current >= 1) {
        setAnimationState('docked')
        console.log('🎯 Orb docked:', version.label)
      }
    }
    
    else if (animationState === 'undocking') {
      // Animate back to original position
      animationProgress.current = Math.max(0, animationProgress.current - delta * DOCK_ANIMATION_SPEED)
      const easedProgress = easeInOutCubic(animationProgress.current)
      
      // Interpolate position: dockedPosition → originalPosition
      currentAnimatedPosition.current = lerpPosition(
        originalPosition.current,
        dockedPosition,
        easedProgress
      )
      
      // Interpolate scale: DOCKED_SCALE → 1
      currentScale.current = lerp(1, DOCKED_SCALE, easedProgress)
      
      // Move the rigid body to the animated position
      body.setTranslation({
        x: currentAnimatedPosition.current[0],
        y: currentAnimatedPosition.current[1],
        z: currentAnimatedPosition.current[2],
      }, true)
      
      // Update visual scale
      if (groupRef.current) {
        groupRef.current.scale.setScalar(currentScale.current)
      }
      
      // When animation complete, return to idle state
      if (animationProgress.current <= 0) {
        // Ensure orb is at a valid position (initial spawn location)
        body.setTranslation({
          x: position[0],
          y: position[1],
          z: position[2],
        }, true)
        
        setAnimationState('idle')
        currentScale.current = 1
        if (groupRef.current) {
          groupRef.current.scale.setScalar(1)
        }
        console.log('🎯 Orb undocked to spawn position:', version.label)
        
        // Give the orb a small impulse to start moving again
        body.applyImpulse({
          x: (Math.random() - 0.5) * 0.5,
          y: (Math.random() - 0.5) * 0.5,
          z: 0,
        }, true)
      }
    }
    
    else if (animationState === 'docked') {
      // Keep orb at docked position and scale
      body.setTranslation({
        x: dockedPosition[0],
        y: dockedPosition[1],
        z: dockedPosition[2],
      }, true)
      
      if (groupRef.current) {
        groupRef.current.scale.setScalar(DOCKED_SCALE)
      }
    }
    
    else if (animationState === 'idle') {
      // Normal physics behavior - ONLY when idle
      // Perlin noise drift for organic motion
      const noiseX = Math.sin(t * 0.3 + seed) * 0.05
      const noiseY = Math.cos(t * 0.2 + seed * 0.7) * 0.05
      body.applyImpulse({ x: noiseX, y: noiseY, z: 0 }, true)

      // ═══════════════════════════════════════════════════════════════════════════════
      // CENTER ATTRACTION - Gentle pull toward origin when idle
      // Keeps orbs from drifting too far and creates a cohesive group
      // ═══════════════════════════════════════════════════════════════════════════════
      const centerPos = new THREE.Vector3(0, 0, 0)
      const orbPos = new THREE.Vector3(pos.x, pos.y, pos.z)
      const toCenter = centerPos.clone().sub(orbPos)
      const distanceToCenter = toCenter.length()
      
      // Apply gentle center attraction (stronger when further away)
      if (distanceToCenter > 3) {
        const centerStrength = 0.02 * Math.min(distanceToCenter / 10, 1)
        const centerAttraction = toCenter.normalize().multiplyScalar(centerStrength)
        body.applyImpulse(centerAttraction, true)
      }

      // Mouse interaction field with proper 3D unprojection
      const vector = new THREE.Vector3(state.pointer.x, state.pointer.y, 0.5)
      vector.unproject(state.camera)
      const dir = vector.sub(state.camera.position).normalize()
      const mousePos = state.camera.position.clone().add(dir.multiplyScalar(20))
      
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
      
      // ═══════════════════════════════════════════════════════════════════════════════
      // 🎵 VINYL REPULSION - Push orbs away from vinyl center when visible
      // Allows orbs to pass above/below but not in front of the vinyl
      // ═══════════════════════════════════════════════════════════════════════════════
      if (isVinylVisible) {
        const vinylPos = new THREE.Vector3(
          vinylCenterPosition[0],
          vinylCenterPosition[1],
          vinylCenterPosition[2]
        )
        
        // Calculate 2D distance (X and Y only) - orbs can pass in Z
        const dx = pos.x - vinylPos.x
        const dy = pos.y - vinylPos.y
        const distance2D = Math.sqrt(dx * dx + dy * dy)
        
        // Repulsion zone radius - vinyl is scale 10 with radius 8 = 80 visual units
        const VINYL_REPULSION_RADIUS = 85  // Larger than vinyl visual (80) to keep orbs on outer rim
        const VINYL_REPULSION_STRENGTH = 1.2
        
        if (distance2D < VINYL_REPULSION_RADIUS) {
          // Calculate repulsion strength (stronger when closer)
          const repulsionFactor = 1 - (distance2D / VINYL_REPULSION_RADIUS)
          const repulsionStrength = VINYL_REPULSION_STRENGTH * repulsionFactor * repulsionFactor // Quadratic falloff
          
          // Direction to push (away from vinyl center, only X and Y)
          const pushX = distance2D > 0.1 ? (dx / distance2D) * repulsionStrength : (Math.random() - 0.5) * repulsionStrength
          const pushY = distance2D > 0.1 ? (dy / distance2D) * repulsionStrength : (Math.random() - 0.5) * repulsionStrength
          
          body.applyImpulse({ x: pushX, y: pushY, z: 0 }, true)
        }
      }
      
      // Ensure scale is 1 when idle
      if (groupRef.current && currentScale.current !== 1) {
        currentScale.current = 1
        groupRef.current.scale.setScalar(1)
      }
    }

    // Clamp linear velocity to prevent orbs from shooting too far away
    const vel = body.linvel()
    const maxSpeed = 6
    const speedSq = vel.x * vel.x + vel.y * vel.y + vel.z * vel.z
    if (speedSq > maxSpeed * maxSpeed) {
      const speed = Math.sqrt(speedSq)
      const scale = maxSpeed / speed
      body.setLinvel(
        { x: vel.x * scale, y: vel.y * scale, z: vel.z * scale },
        true
      )
    }

    // PULSING GLOW - Enhanced when playing/docked
    if (glowRef.current) {
      if (animationState === 'docked' || animationState === 'docking') {
        // DOCKED ORB: Faster, brighter pulse
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

  const handleClick = (e?: { stopPropagation?: () => void }) => {
    e?.stopPropagation?.()

    const now = Date.now()
    if (now - lastClickRef.current < 400) return
    lastClickRef.current = now

    console.log('🎮 Version orb clicked:', version.label)
    console.log('   Animation state:', animationState)
    console.log('   Version ID:', version.id)
    console.log('   Song ID:', version.songId)
    console.log('   Audio URL:', version.audio_url)
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // 🎯 DOCKING CLICK LOGIC
    // ═══════════════════════════════════════════════════════════════════════════════
    
    if (animationState === 'idle') {
      // Start docking animation
      // Capture current position from physics body
      if (ref.current) {
        const pos = ref.current.translation()
        originalPosition.current = [pos.x, pos.y, pos.z]
      }
      animationProgress.current = 0
      setAnimationState('docking')
      
      // Play this version based on autoplay mode:
      // - 'all': Build global queue from all albums (async)
      // - 'album': Build queue from current album only
      // - 'off': Play single track
      if (autoplayMode === 'all') {
        startGlobalQueue(version, albumPalette as any)
      } else if (autoplayMode === 'album') {
        startAlbumQueue(allVersions as any, version.id, albumPalette as any)
      } else {
        play(version, version.songId, albumPalette, true)
      }
      console.log('🚀 Starting dock animation for:', version.label)
    } 
    else if (animationState === 'docked') {
      // Clicking a docked (playing) orb restarts the track from beginning
      setCurrentTime(0)
      console.log('🔄 Restarting track from beginning:', version.label)
    }
    // Ignore clicks during animation
  }
  
  // Determine RigidBody type based on animation state
  // - 'dynamic': Normal physics (idle)
  // - 'kinematicPosition': Manual position control (docking/docked/undocking)
  const rigidBodyType = animationState === 'idle' ? 'dynamic' : 'kinematicPosition'

  return (
    <RigidBody
      ref={ref}
      type={rigidBodyType}
      colliders="ball"
      restitution={0.8}
      friction={0.1}
      linearDamping={adjustedLinearDamping}
      angularDamping={0.5}
      gravityScale={0}
      mass={1.0}  // ✅ FIX 1: Consistent mass for all orbs (was radius * 0.5, which made small albums 75% heavier)
      ccd={true}
      position={position}
    >
      <group ref={groupRef}>
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
            onHover(version)
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
            transmission={0.995}
            thickness={0.04}
            roughness={0.35}
            ior={1.15}
            chromaticAberration={0}
            anisotropicBlur={0}
            distortion={0}
            samples={quality.samples}
            toneMapped={false}
            color="white"
            opacity={0.06}
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
              emissive="white"
              emissiveMap={texture}
              emissiveIntensity={(isThisPlaying ? 2.25 : 0.75) * mobileIntensityBoost}  // 🎨 OPTION C: Maximum texture visibility
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
      </group>
    </RigidBody>
  )
}
