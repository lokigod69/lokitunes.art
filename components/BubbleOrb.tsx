// Changes: Remove world-origin centering so orbs cluster around the cursor (MouseAttraction baseline); keep subtle drift and reduce idle jitter with damping and softer cushion (2025-12-24)
'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, BallCollider, type RapierRigidBody } from '@react-three/rapier'
import { MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'
import type { Album } from '@/lib/supabase'
import type { DeviceTier } from '@/lib/device-detection'
import { getQualitySettings } from '@/lib/device-detection'
import { getAlbumCoverUrl } from '@/lib/supabase-images'
import { useSmartTexture } from '@/hooks/useSmartTexture'
import { usePlayMode } from '@/hooks/usePlayMode'
import { useOrbRepulsion } from '@/hooks/useOrbRepulsion'
import { devLog } from '@/lib/debug'

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
  pushTrigger?: number
  position: [number, number, number]
  radius: number
  visualScale?: number  // Visual-only scale (0.6-1.0) based on version count
  deviceTier: DeviceTier
  onHover: (title: string | null) => void
  onNavigate: (slug: string) => void
  onRegisterRigidBody?: (body: RapierRigidBody) => void
  resetTrigger?: number
  orbIndex?: number  // Index for play mode tracking
  allBodiesRef?: React.RefObject<Map<string, { body: RapierRigidBody, initialPos: [number, number, number] }> | null>
}


export function BubbleOrb({ 
  album,
  pushTrigger,
  position,
  radius,
  visualScale = 1,
  deviceTier,
  onHover, 
  onNavigate,
  onRegisterRigidBody,
  resetTrigger,
  orbIndex = 0,
  allBodiesRef
}: BubbleOrbProps) {
  devLog('🔵 BubbleOrb rendering:', album.title, '| roughness: 0.7 | emissive: 1.0/0.5 | pointLight: 0.2x')
  const ref = useRef<RapierRigidBody>(null)
  const glowRef = useRef<THREE.PointLight>(null)
  const innerMeshRef = useRef<THREE.Mesh>(null)
  const lastClickRef = useRef(0)
  const [hovered, setHovered] = useState(false)
  const [isLost, setIsLost] = useState(false)
  const [pendingBurst, setPendingBurst] = useState(false)
  const playModeInitialized = useRef(false)
  const lastPositionRef = useRef<[number, number, number]>([0, 0, 0])
  const lastMouseRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 })
  const mouseIdleFrames = useRef(0)
  
  // Play mode state
  const { isActive: playModeActive, isPaused: playModePaused, loseOrb, orbsLost, triggerBurst } = usePlayMode()
  
  // Handle pending burst in useEffect (outside physics loop to avoid Rapier crashes)
  useEffect(() => {
    if (pendingBurst) {
      // Get album colors for burst
      const burstColors = [
        album.palette?.dominant || '#ffffff',
        album.palette?.accent1 || '#ff00ff',
        album.palette?.accent2 || '#00ffff',
      ].filter(Boolean)
      
      // Trigger burst at last known position
      triggerBurst(lastPositionRef.current, burstColors)
      
      // Mark orb as lost
      loseOrb(orbIndex)
      
      // Move orb far away (but keep RigidBody alive for reset)
      if (ref.current) {
        try {
          ref.current.setTranslation({ x: 0, y: -100, z: 0 }, true)
          ref.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
        } catch (e) {
          // Body may be invalid, ignore
        }
      }
    }
  }, [pendingBurst, triggerBurst, loseOrb, orbIndex, album.palette])
  
  // Restore orb when play mode ends
  useEffect(() => {
    if (!playModeActive && pendingBurst) {
      setPendingBurst(false)
    }
  }, [playModeActive, pendingBurst])
  
  // Repulsion state - use hook for collider size (re-renders when changed)
  const { repulsionStrength } = useOrbRepulsion()
  
  // Calculate collider radius based on repulsion - larger collider = orbs push apart physically
  const colliderRadius = radius * visualScale * (1 + repulsionStrength * 2)
  
  const quality = getQualitySettings(deviceTier)

  // Load texture with smart loader (tries album.cover_url first, then bucket fallbacks)
  const directCoverUrl = album.cover_url
  const possibleUrls = directCoverUrl
    ? [directCoverUrl, ...getAlbumCoverUrl(album.slug)]
    : getAlbumCoverUrl(album.slug)
  devLog(`🔍 Attempting to load texture for ${album.title}:`, possibleUrls.slice(0, 3))
  const texture = useSmartTexture(possibleUrls, album.title)

  // Configure texture for maximum sharpness
  useEffect(() => {
    if (texture) {
      devLog(`✅ Texture loaded for ${album.title}:`, texture)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.minFilter = THREE.LinearFilter  // Sharp when zoomed out
      texture.magFilter = THREE.LinearFilter  // Sharp when zoomed in
      texture.anisotropy = deviceTier === 'high' ? 16 : deviceTier === 'medium' ? 4 : 2
      texture.needsUpdate = true
    } else {
      devLog(`❌ NO texture for ${album.title} - using fallback color`)
    }
  }, [texture, album.title, deviceTier])

  const seed = album.id.charCodeAt(0) * 137.5

  // Detect mobile for enhanced visuals
  const isMobileDevice = deviceTier === 'low' || deviceTier === 'medium'

  // Mobile gets brighter glow for better visibility
  const mobileIntensityBoost = isMobileDevice ? 1.2 : 1.0

  // Use album's dominant color for glow, fallback to voltage blue
  // Palette colors are now cleaned at the source (queries.ts)
  const glowColor = album.palette?.dominant || album.palette?.accent1 || '#4F9EFF'
  const normalizedIntensity = normalizeEmissiveIntensity(glowColor)

  function isColorBright(hexColor: string): boolean {
    if (!hexColor) return false

    const hex = hexColor.replace('#', '')
    if (hex.length < 6) return false

    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.7
  }

  const isBrightCover = album.palette?.dominant
    ? isColorBright(album.palette.dominant)
    : false

  const baseEmissive = 0.75
  const emissiveReduction = isBrightCover ? 0.3 : 1.0
  const emissiveIntensity = baseEmissive * emissiveReduction * mobileIntensityBoost
  
  // Hover state is now managed by parent OrbField component
  // Album info displays in bottom-left InfoDisplayCube

  // Depth interaction constants - SIMPLIFIED
  const PUSH_FORCE = -15        // Moderate push
  const SPRING_STRENGTH = 0.3   // Gentle pull
  const HOME_Z = 0               // Front position
  const SETTLE_TIME = 2000       // Wait 2 seconds before returning
  const MAX_SETTLE_TIME = 5000   // Safety: force return after 5 seconds
  const MAX_BACK_Z = -60
  const FRONT_CORRECT_STRENGTH = 0.015
  
  // Track when last pushed (for settle time)
  const lastPushTime = useRef(0)

  // Register rigid body on mount
  useEffect(() => {
    if (!ref.current) return
    const body = ref.current
    
    // Register with parent for reset functionality
    if (onRegisterRigidBody) {
      onRegisterRigidBody(body)
    }
  }, [onRegisterRigidBody])

  // Handle reset trigger
  useEffect(() => {
    if (!ref.current || resetTrigger === 0) return
    
    // Reset is handled by parent, but we can add any orb-specific reset logic here
    // For now, just reset the lastPushTime
    lastPushTime.current = 0
    setPendingBurst(false)
    setIsLost(false)
    playModeInitialized.current = false
  }, [resetTrigger])

  // Depth interaction: Push orb backward when triggered
  useEffect(() => {
    if (!ref.current || pushTrigger === 0) return
    
    const body = ref.current
    const velBefore = body.linvel()
    
    devLog('🟦 Pushing', album.title, 'backward')
    
    // RESET timer on each push (allows extending settle time)
    lastPushTime.current = Date.now()
    
    // Set velocity directly (bypasses impulse system)
    body.wakeUp()
    body.setLinvel({ 
      x: velBefore.x, 
      y: velBefore.y, 
      z: -20  // Strong backward velocity
    }, true)
  }, [pushTrigger, album.title])

  useFrame((state) => {
    if (!ref.current || pendingBurst) return
    
    // Wrap body access in try-catch - body may have been removed
    let pos, vel
    try {
      pos = ref.current.translation()
      vel = ref.current.linvel()
      // Track position for burst effect (safe to do here)
      lastPositionRef.current = [pos.x, pos.y, pos.z]
    } catch (e) {
      // Body was removed, skip this frame
      return
    }

    const t = state.clock.elapsedTime
    const body = ref.current
    
    // MOUSE MOVEMENT DETECTION - only apply forces when cursor is moving
    const currentMouse = { x: state.pointer.x, y: state.pointer.y }
    const mouseDeltaX = currentMouse.x - lastMouseRef.current.x
    const mouseDeltaY = currentMouse.y - lastMouseRef.current.y
    const mouseSpeed = Math.sqrt(mouseDeltaX * mouseDeltaX + mouseDeltaY * mouseDeltaY)
    lastMouseRef.current = currentMouse
    
    // Track how many frames mouse has been idle
    const MOUSE_IDLE_THRESHOLD = 0.0035  // Very small movement threshold
    if (mouseSpeed < MOUSE_IDLE_THRESHOLD) {
      mouseIdleFrames.current++
    } else {
      mouseIdleFrames.current = 0
    }
    
    // Mouse is considered "at rest" after ~20 frames (~0.33 seconds at 60fps)
    const isMouseIdle = mouseIdleFrames.current > 20
    
    // Calculate current speed for rest detection
    const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z)
    const forceScale = radius * visualScale

    // Ensure bodies don't remain sleeping after previous idle logic.
    if (body.isSleeping()) {
      body.wakeUp()
    }

    // When mouse is idle, gently damp velocity to reduce jitter but keep physics active.
    if (isMouseIdle && speed > 0.02) {
      body.setLinvel({ x: vel.x * 0.92, y: vel.y * 0.92, z: vel.z * 0.92 }, true)
    } else if (isMouseIdle && speed < 0.008) {
      const zError = HOME_Z - pos.z
      const shouldFreezeZ = Math.abs(zError) < 0.03
      body.setLinvel({ x: vel.x * 0.6, y: vel.y * 0.6, z: shouldFreezeZ ? 0 : vel.z }, true)
    }

    // Perlin noise drift for organic motion (reduced while idle).
    const noiseScale = isMouseIdle ? 0.12 : 1
    const noiseX = Math.sin(t * 0.3 + seed) * 0.04 * forceScale * noiseScale
    const noiseY = Math.cos(t * 0.2 + seed * 0.7) * 0.04 * forceScale * noiseScale
    body.applyImpulse({ x: noiseX, y: noiseY, z: 0 }, true)

    // SOFT PROXIMITY CUSHION - prevents deep overlap and sticky behavior
    // Always-on gentle repulsion between nearby orbs (independent of slider)
    if (allBodiesRef?.current) {
      const shouldRunCushion = !(
        (deviceTier === 'low' || deviceTier === 'medium') &&
        orbIndex % 2 !== Math.floor(t * 60) % 2
      )

      if (shouldRunCushion) {
        const cushionDistance = colliderRadius * 2.1  // Start pushing before contact
        const currentRepulsion = useOrbRepulsion.getState().repulsionStrength

        allBodiesRef.current.forEach(({ body: otherBody }, otherId) => {
          if (otherId === album.id) return

          try {
            const otherPos = otherBody.translation()
            const toOther = new THREE.Vector3(
              otherPos.x - pos.x,
              otherPos.y - pos.y,
              isMouseIdle ? 0 : (otherPos.z - pos.z)
            )
            const dist = toOther.length()

            // Soft cushion: gentle push when close, before hard collision
            if (dist < cushionDistance && dist > 0.1) {
              const overlap = 1 - (dist / cushionDistance)
              // Base cushion + extra from slider
              const cushionStrength = 0.015 * overlap * overlap + currentRepulsion * 0.08 * overlap
              const pushForce = toOther.normalize().multiplyScalar(-cushionStrength * forceScale)
              body.applyImpulse(pushForce, true)
            }
          } catch (e) {
            // Other body might be invalid
          }
        })
      }
    }

    // Gentle rotation for inner sphere
    if (innerMeshRef.current) {
      innerMeshRef.current.rotation.y = t * 0.1
    }

    if (glowRef.current) {
      const pulse = Math.sin(t * 1.5) * 0.5 + 1.5
      glowRef.current.intensity = normalizedIntensity * pulse
    }

    // PLAY MODE: Only check for off-screen (no per-frame Z constraint - causes chaos)
    if (playModeActive && !playModePaused && !orbsLost.includes(orbIndex)) {
      // Check if orb went off-screen (lost)
      const OFF_SCREEN_X = 22
      const OFF_SCREEN_Y_TOP = 12
      const OFF_SCREEN_Y_BOTTOM = -17
      
      if (Math.abs(pos.x) > OFF_SCREEN_X || pos.y > OFF_SCREEN_Y_TOP || pos.y < OFF_SCREEN_Y_BOTTOM) {
        loseOrb(orbIndex)
        setIsLost(true)
        // Move orb far away so it's not visible
        body.setTranslation({ x: 0, y: -100, z: 0 }, true)
        body.setLinvel({ x: 0, y: 0, z: 0 }, true)
      }
    }
    
    // SPRING RETURN TO FRONT - Depth interaction (disabled during play mode)
    // Only activate if pushed back past -0.5
    if (!playModeActive && pos.z < -0.5) {
      const timeSincePush = Date.now() - lastPushTime.current
      
      // SETTLE TIME: Wait before returning (RESET + SAFETY)
      // - Each push resets timer (playful interaction)
      // - But force return after MAX_SETTLE_TIME (safety)
      const shouldReturn = timeSincePush > SETTLE_TIME || timeSincePush > MAX_SETTLE_TIME
      
      if (shouldReturn) {
        // CRITICAL: Wake up sleeping bodies!
        body.wakeUp()
        
        // Natural variation per orb (using album ID as seed)
        const springVariation = 0.8 + (seed % 5) * 0.1  // 0.8 to 1.2
        const adjustedSpring = SPRING_STRENGTH * springVariation
        
        // QUADRATIC spring: stronger pull when further away
        const distance = Math.abs(pos.z)
        const springForce = distance * distance * adjustedSpring
        
        body.applyImpulse({ x: 0, y: 0, z: springForce }, true)
      }
    }

    if (!playModeActive) {
      if (pos.z < MAX_BACK_Z) {
        body.setTranslation({ x: pos.x, y: pos.y, z: MAX_BACK_Z }, true)
        body.setLinvel({ x: vel.x, y: vel.y, z: 0 }, true)
      }

      const timeSincePush = Date.now() - lastPushTime.current
      const isInDepthInteraction = lastPushTime.current !== 0 && timeSincePush < SETTLE_TIME
      if (!isInDepthInteraction) {
        const zError = HOME_Z - pos.z
        if (isMouseIdle && Math.abs(zError) < 0.08 && Math.abs(vel.z) < 0.12) {
          body.setTranslation({ x: pos.x, y: pos.y, z: HOME_Z }, true)
          body.setLinvel({ x: vel.x, y: vel.y, z: 0 }, true)
        } else {
          if (Math.abs(zError) > 0.02) {
            body.applyImpulse({ x: 0, y: 0, z: zError * zError * Math.sign(zError) * FRONT_CORRECT_STRENGTH }, true)
          }
          if (Math.abs(vel.z) > 0.02) {
            body.setLinvel({ x: vel.x, y: vel.y, z: vel.z * 0.65 }, true)
          }
        }
      }
    }

  })

  return (
    <RigidBody
      ref={ref}
      type="dynamic"            // CRITICAL: Must be dynamic to respond to forces!
      colliders={false}         // Use custom BallCollider for dynamic sizing
      restitution={0.6}         // Balanced bounce - lower to prevent jittering
      friction={0.15}           // Light friction (was 0.1, then 0.3)
      linearDamping={0.12}      // Slight damping (was 0.05, then 0.8)
      angularDamping={0.5}      // REDUCED - More rotation
      gravityScale={0}
      mass={radius * 0.5}       // LIGHTER = more responsive to forces
      ccd={true}                // Continuous collision detection
      position={position}
      name={`orb-${album.id}`}
      onCollisionEnter={({ other }) => {
        // Only process in play mode - ONLY set flag, no physics operations!
        if (!playModeActive || pendingBurst) return
        
        // Check if we hit a game obstacle
        const otherName = other.rigidBodyObject?.name || ''
        if (otherName.includes('obstacle')) {
          // Just set flag - burst handling happens in useEffect (next frame)
          setPendingBurst(true)
        }
      }}
    >
      {/* Dynamic collider - grows with repulsion slider */}
      <BallCollider args={[colliderRadius]} restitution={0.85} friction={0.03} />
      
      <group scale={visualScale}>
        <pointLight
          ref={glowRef}
          color={glowColor}
          intensity={normalizedIntensity * 0.2}
          distance={radius * 5}
        />

        {/* Outer glass shell - BARELY THERE (just a subtle shine) */}
        <mesh
          onClick={(e) => {
            e.stopPropagation()
            const now = Date.now()
            if (now - lastClickRef.current < 400) return
            lastClickRef.current = now
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

        {/* Inner album art sphere - HUGE and SUPER BRIGHT */}
        {/* ═══════════════════════════════════════════════════════════════════════════════
            🎨 TEXTURE VISIBILITY - Option C (Maximum - 90% visibility)
            Matches VersionOrb settings for consistency
            ═══════════════════════════════════════════════════════════════════════════════ */}
        {texture && (
          <mesh ref={innerMeshRef} scale={0.95}>
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
              emissiveIntensity={emissiveIntensity}
              metalness={0.3}
              roughness={0.7}  // 🎨 OPTION C: Was 0.1
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
        
        {/* Tooltip removed - album info now displays in bottom-left InfoDisplayCube */}
      </group>
    </RigidBody>
  )
}
