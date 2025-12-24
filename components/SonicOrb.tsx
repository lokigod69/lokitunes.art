// Changes: Remove world-origin centering so orbs cluster around the cursor (MouseAttraction baseline); keep subtle drift and reduce idle jitter with damping and softer cushion (2025-12-24)
'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, BallCollider, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import type { Album } from '@/lib/supabase'
import { usePlayMode } from '@/hooks/usePlayMode'
import { useOrbRepulsion } from '@/hooks/useOrbRepulsion'
import { devLog } from '@/lib/debug'

interface OrbProps {
  album: Album
  pushTrigger?: number
  position: [number, number, number]
  radius: number
  visualScale?: number  // Visual-only scale (0.6-1.0) based on version count
  deviceTier?: 'low' | 'medium' | 'high'
  onHover: (title: string | null) => void
  onNavigate: (slug: string) => void
  onRegisterRigidBody?: (body: RapierRigidBody) => void
  resetTrigger?: number
  orbIndex?: number  // Index for play mode tracking
  allBodiesRef?: React.RefObject<Map<string, { body: RapierRigidBody, initialPos: [number, number, number] }> | null>
}

export function SonicOrb({ album, pushTrigger, position, radius, visualScale = 1, deviceTier, onHover, onNavigate, onRegisterRigidBody, resetTrigger, orbIndex = 0, allBodiesRef }: OrbProps) {
  devLog('🟠 SonicOrb rendering:', album.title, '| NO glass layer | roughness: 0.6 | NO emissive')
  const ref = useRef<RapierRigidBody>(null)
  const glowRef = useRef<THREE.PointLight>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const lastClickRef = useRef(0)
  const [isLost, setIsLost] = useState(false)
  const [pendingBurst, setPendingBurst] = useState(false)
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
      // CRITICAL: Set color space BEFORE needsUpdate to prevent black textures
      newTexture.colorSpace = THREE.SRGBColorSpace
      newTexture.needsUpdate = true
      setTexture(newTexture)
      devLog('✅ Texture loaded:', album.title, album.cover_url)
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

  const seed = album.id.charCodeAt(0) * 137.5

  // Palette colors are now cleaned at the source (queries.ts)
  const accentColor = album.palette?.accent1 || '#4F9EFF'

  // Depth interaction constants - SIMPLIFIED
  const PUSH_FORCE = -15        // Moderate push
  const SPRING_STRENGTH = 0.3   // Gentle pull
  const HOME_Z = 0               // Front position
  const SETTLE_TIME = 2000       // Wait 2 seconds before returning
  const MAX_SETTLE_TIME = 5000   // Safety: force return after 5 seconds
  
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
  }, [resetTrigger])

  // Depth interaction: Push orb backward when triggered
  useEffect(() => {
    if (!ref.current || pushTrigger === 0) return
    
    const body = ref.current
    const velBefore = body.linvel()
    
    devLog('🟠 Pushing', album.title, 'backward')
    
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
      body.setLinvel({ x: 0, y: 0, z: 0 }, true)
    }

    // Perlin noise drift for organic motion (reduced while idle).
    const noiseScale = isMouseIdle ? 0.25 : 1
    const noiseX = Math.sin(t * 0.3 + seed) * 0.04 * forceScale * noiseScale
    const noiseY = Math.cos(t * 0.2 + seed * 0.7) * 0.04 * forceScale * noiseScale
    body.applyImpulse({ x: noiseX, y: noiseY, z: 0 }, true)

    // SOFT PROXIMITY CUSHION - prevents deep overlap and sticky behavior
    // Always-on gentle repulsion between nearby orbs (independent of slider)
    if (allBodiesRef?.current) {
      const cushionDistance = colliderRadius * 2.1  // Start pushing before contact
      const currentRepulsion = useOrbRepulsion.getState().repulsionStrength

      allBodiesRef.current.forEach(({ body: otherBody }, otherId) => {
        if (otherId === album.id) return

        try {
          const otherPos = otherBody.translation()
          const toOther = new THREE.Vector3(
            otherPos.x - pos.x,
            otherPos.y - pos.y,
            otherPos.z - pos.z
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

    // Glow pulse
    if (glowRef.current) {
      glowRef.current.intensity = 0.8 + Math.sin(t * 0.7) * 0.2
    }

    // Gentle rotation
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.1
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
  })

  return (
    <RigidBody
      ref={ref}
      type="dynamic"            // CRITICAL: Must be dynamic to respond to forces!
      colliders={false}         // Use custom BallCollider for dynamic sizing
      restitution={0.6}         // Balanced bounce - lower to prevent jittering
      friction={0.15}           // Light friction (was 0.1, then 0.3)
      linearDamping={0.12}      // Slight damping (was 0.05, then 0.8)
      angularDamping={0.5}      // Match BubbleOrb/VersionOrb (was 0.3)
      gravityScale={0}          // Add missing property
      mass={radius * 0.5}       // Add missing property - LIGHTER = more responsive
      ccd={true}                // Add continuous collision detection
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
          onClick={(e) => {
            e.stopPropagation()
            const now = Date.now()
            if (now - lastClickRef.current < 400) return
            lastClickRef.current = now
            onNavigate(album.slug)
          }}
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
              metalness={0.2}
              roughness={0.4}
              envMapIntensity={0.8}
              emissive="white"
              emissiveMap={texture}
              emissiveIntensity={1.2}
              toneMapped={false}
              dispose={null}
            />
          ) : (
            <meshStandardMaterial
              color={accentColor}
              metalness={0.2}
              roughness={0.4}
              emissive={accentColor}
              emissiveIntensity={1.2}
              toneMapped={false}
              dispose={null}
            />
          )}
        </mesh>
      </group>
    </RigidBody>
  )
}
