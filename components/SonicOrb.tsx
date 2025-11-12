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
  deviceTier?: 'low' | 'medium' | 'high'
  onHover: (title: string | null) => void
  onNavigate: (slug: string) => void
}

export function SonicOrb({ album, pushTrigger, position, radius, deviceTier, onHover, onNavigate }: OrbProps) {
  console.log('🟠 SonicOrb rendering:', album.title, '| NO glass layer | roughness: 0.6 | NO emissive')
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

  // Depth interaction constants - Path B: Gentle, floaty
  const PUSH_FORCE = -15        // Moderate push
  const SPRING_STRENGTH = 0.3   // Gentle pull
  const DAMPING = 0.5            // Smooth stop
  const HOME_Z = 0               // Front position
  const DEAD_ZONE = -2           // Don't spring until past this
  const MAX_DEPTH = -40          // Don't push beyond this

  // Depth interaction: Push orb backward when triggered
  useEffect(() => {
    if (!ref.current || pushTrigger === 0) return
    
    const body = ref.current
    const currentZ = body.translation().z
    
    // Only push if not at max depth
    if (currentZ > MAX_DEPTH) {
      console.log('🟠 Pushing', album.title, 'backward from Z:', currentZ.toFixed(2))
      
      // CRITICAL: Wake up body before applying force
      body.wakeUp()
      body.applyImpulse({ x: 0, y: 0, z: PUSH_FORCE }, true)
    } else {
      console.log('⚠️', album.title, 'already at max depth:', currentZ.toFixed(2))
    }
  }, [pushTrigger, album.title, PUSH_FORCE, MAX_DEPTH])

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
    // Only activate spring if pushed past dead zone
    if (pos.z < (HOME_Z - DEAD_ZONE)) {
      const vel = body.linvel()
      
      // CRITICAL: Wake up sleeping bodies!
      body.wakeUp()
      
      // Natural variation per orb (using album ID as seed)
      const springVariation = 0.8 + (seed % 5) * 0.1  // 0.8 to 1.2
      const adjustedSpring = SPRING_STRENGTH * springVariation
      
      // QUADRATIC spring: stronger pull when further away
      const distance = Math.abs(HOME_Z - pos.z)
      const springForce = distance * distance * adjustedSpring
      
      // SMART DAMPING: Only damp when moving away from home
      let dampingForce = 0
      if (vel.z < 0) {  // Moving backward (away from home)
        dampingForce = -vel.z * DAMPING
      }
      
      // Combined return force
      const returnForce = springForce + dampingForce
      
      body.applyImpulse({ x: 0, y: 0, z: returnForce }, true)
    }
  })

  return (
    <RigidBody
      ref={ref}
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
              dispose={null}
            />
          ) : (
            <meshStandardMaterial
              color={accentColor}
              metalness={0.5}
              roughness={0.5}
              dispose={null}
            />
          )}
        </mesh>
      </group>
    </RigidBody>
  )
}
