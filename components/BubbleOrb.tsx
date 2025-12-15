'use client'

import { useRef, useState, useEffect } from 'react'
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
  pushTrigger?: number
  position: [number, number, number]
  radius: number
  visualScale?: number  // Visual-only scale (0.6-1.0) based on version count
  deviceTier: DeviceTier
  onHover: (title: string | null) => void
  onNavigate: (slug: string) => void
  onRegisterRigidBody?: (body: RapierRigidBody) => void
  resetTrigger?: number
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
  resetTrigger
}: BubbleOrbProps) {
  const ref = useRef<RapierRigidBody>(null)
  const innerMeshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const prevPointer = useRef({ x: 0, y: 0 })
  
  const quality = getQualitySettings(deviceTier)

  // Load texture with smart loader (tries album.cover_url first, then bucket fallbacks)
  const directCoverUrl = album.cover_url
  const possibleUrls = directCoverUrl
    ? [directCoverUrl, ...getAlbumCoverUrl(album.slug)]
    : getAlbumCoverUrl(album.slug)
  const texture = useSmartTexture(possibleUrls, album.title)

  // Configure texture for maximum sharpness
  useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.minFilter = THREE.LinearFilter  // Sharp when zoomed out
      texture.magFilter = THREE.LinearFilter  // Sharp when zoomed in
      texture.anisotropy = 16  // Maximum sharpness
      texture.needsUpdate = true
    }
  }, [texture, album.title])

  const seed = album.id.charCodeAt(0) * 137.5

  // Use album's dominant color for glow, fallback to voltage blue
  // Palette colors are now cleaned at the source (queries.ts)
  const glowColor = album.palette?.dominant || album.palette?.accent1 || '#4F9EFF'
  
  // Hover state is now managed by parent OrbField component
  // Album info displays in bottom-left InfoDisplayCube
  
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
    if (!ref.current) return

    const t = state.clock.elapsedTime
    const body = ref.current
    const pos = body.translation()

    const dx = state.pointer.x - prevPointer.current.x
    const dy = state.pointer.y - prevPointer.current.y
    const isPointerMoving = Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001
    prevPointer.current = { x: state.pointer.x, y: state.pointer.y }

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
    if (!isPointerMoving) {
      // no mouse forces when pointer is still
    } else if (distance < tooClose) {
      // Repel when too close
      const repulsion = toCursor.clone().normalize().multiplyScalar(-0.2)
      body.applyImpulse(repulsion, true)
    } else if (distance < 8) {
      // Attract when in range (increased from 6 to 8)
      const strength = 0.15 * (1 - distance / 8)  // Increased from 0.12
      const attraction = toCursor.normalize().multiplyScalar(strength)
      body.applyImpulse(attraction, true)
    }

    // Gentle rotation for inner sphere
    if (innerMeshRef.current) {
      innerMeshRef.current.rotation.y = t * 0.1
    }

    // SPRING RETURN TO FRONT - Depth interaction
    // Only activate if pushed back past -0.5
    if (pos.z < -0.5) {
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
      colliders="ball"
      restitution={0.1}
      friction={0.7}
      linearDamping={2.0}
      angularDamping={2.0}
      gravityScale={0}
      mass={radius * 0.5}       // LIGHTER = more responsive to forces
      ccd={true}                // Continuous collision detection
      position={position}
    >
      <group scale={visualScale}>
        {/* Outer glass shell - BARELY THERE (just a subtle shine) */}
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
            transmission={0}
            thickness={0.04}
            roughness={0.35}
            ior={1.15}
            chromaticAberration={0}
            anisotropicBlur={0}
            distortion={0}
            samples={quality.samples}
            toneMapped={false}
            color="white"
            opacity={0}
            colorWrite={false}
            depthWrite={false}
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
              metalness={0.3}
              roughness={0.7}  // 🎨 OPTION C: Was 0.1
              toneMapped={true}
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
              metalness={0.0}
              roughness={0.9}
              toneMapped={true}
              dispose={null}
            />
          </mesh>
        )}
        
        {/* Tooltip removed - album info now displays in bottom-left InfoDisplayCube */}
      </group>
    </RigidBody>
  )
}
