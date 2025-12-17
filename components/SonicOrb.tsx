'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import type { Album } from '@/lib/supabase'

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
}

export function SonicOrb({ album, pushTrigger, position, radius, visualScale = 1, deviceTier, onHover, onNavigate, onRegisterRigidBody, resetTrigger }: OrbProps) {
  console.log('🟠 SonicOrb rendering:', album.title, '| NO glass layer | roughness: 0.6 | NO emissive')
  const ref = useRef<RapierRigidBody>(null)
  const glowRef = useRef<THREE.PointLight>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const lastClickRef = useRef(0)
  
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
    
    console.log('🟠 Pushing', album.title, 'backward')
    
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
      restitution={0.8}         // Match BubbleOrb/VersionOrb (was 0.7)
      friction={0.1}            // Match BubbleOrb/VersionOrb (was 0.2)
      linearDamping={0.05}      // Match BubbleOrb/VersionOrb (was 0.2) ⭐ KEY FIX
      angularDamping={0.5}      // Match BubbleOrb/VersionOrb (was 0.3)
      gravityScale={0}          // Add missing property
      mass={radius * 0.5}       // Add missing property - LIGHTER = more responsive
      ccd={true}                // Add continuous collision detection
      position={position}
    >
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
