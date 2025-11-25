'use client'

import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSmartTexture } from '@/hooks/useSmartTexture'
import type { Album } from '@/lib/supabase'

interface AlbumArtworkDisplayProps {
  albumCoverUrl: string | null
  albumPalette: Album['palette']
  visible: boolean
  position?: [number, number, number]
  albumTitle?: string
  onVinylClick?: () => void  // NEW: Called when vinyl is clicked to release docked orb
  isPlaying?: boolean        // NEW: When playing, vinyl spins
}

export function AlbumArtworkDisplay({ 
  albumCoverUrl, 
  albumPalette,
  visible,
  position = [0, -5, -45],
  albumTitle = 'Album',
  onVinylClick,
  isPlaying = false
}: AlbumArtworkDisplayProps) {
  const groupRef = useRef<THREE.Group>(null)
  const artworkMeshRef = useRef<THREE.Mesh>(null)
  const groovesMeshRef = useRef<THREE.Mesh>(null)
  const targetOpacity = useRef(0)
  const currentOpacity = useRef(0)

  // Load album artwork texture
  const possibleUrls = albumCoverUrl ? [albumCoverUrl] : []
  const texture = useSmartTexture(possibleUrls, albumTitle)

  // Configure texture
  useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.anisotropy = 16
      texture.needsUpdate = true
    }
  }, [texture])

  // Animate visibility, rotation, and glitch effects
  useFrame((state, delta) => {
    if (!groupRef.current || !artworkMeshRef.current) return

    const t = state.clock.elapsedTime

    // Smooth fade in/out
    targetOpacity.current = visible ? 1 : 0
    currentOpacity.current += (targetOpacity.current - currentOpacity.current) * 0.1

    // Only render if opacity > 0
    groupRef.current.visible = currentOpacity.current > 0.01
    
    // 🎵 VINYL ROTATION - Spin when playing (clockwise, like a real record)
    if (isPlaying && currentOpacity.current > 0.01) {
      groupRef.current.rotation.z -= delta * 0.5  // Clockwise rotation (negative = clockwise when viewed from front)
    }

    if (currentOpacity.current > 0.01) {
      // Glitch effect: pulsing opacity
      const glitchPulse = Math.sin(t * 2.5) * 0.1
      const finalOpacity = Math.max(0, Math.min(1, currentOpacity.current * (0.85 + glitchPulse)))

      // Apply to artwork
      const artMaterial = artworkMeshRef.current.material as THREE.MeshBasicMaterial
      if (artMaterial) {
        artMaterial.opacity = finalOpacity
      }

      // Subtle scale pulse for "breathing" effect
      const scalePulse = 1 + Math.sin(t * 1.2) * 0.015
      groupRef.current.scale.setScalar(scalePulse)

      // Very subtle rotation wobble
      groupRef.current.rotation.z = Math.sin(t * 0.8) * 0.02

      // Animate grooves for vinyl authenticity
      if (groovesMeshRef.current) {
        const grooveMaterial = groovesMeshRef.current.material as THREE.MeshStandardMaterial
        if (grooveMaterial) {
          grooveMaterial.opacity = currentOpacity.current * 0.4
        }
      }
    }
  })

  const accentColor = albumPalette?.accent1 || '#4F9EFF'

  // Handle vinyl click - release docked orb
  const handleVinylClick = () => {
    if (onVinylClick) {
      console.log('🎵 Vinyl clicked - releasing docked orb')
      onVinylClick()
    }
  }

  return (
    <group 
      ref={groupRef} 
      rotation={[0, 0, 0]} 
      position={position}
      visible={false}
      scale={10.0}  // Much larger vinyl - prominent in background
    >
      {/* Outer vinyl disc (black with slight sheen) - CLICKABLE */}
      <mesh 
        onClick={handleVinylClick}
        onPointerEnter={() => { if (onVinylClick) document.body.style.cursor = 'pointer' }}
        onPointerLeave={() => { document.body.style.cursor = 'default' }}
      >
        <circleGeometry args={[8, 64]} />
        <meshStandardMaterial 
          color="#0a0a0a"
          roughness={0.3}
          metalness={0.7}
          emissive="#000000"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Vinyl grooves (darker concentric rings effect) */}
      <mesh ref={groovesMeshRef} position={[0, 0, 0.01]}>
        <ringGeometry args={[3.5, 7.8, 64]} />
        <meshStandardMaterial 
          color="#050505"
          transparent
          opacity={0.4}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Album artwork (center of vinyl) - CLICKABLE */}
      {texture && (
        <mesh 
          ref={artworkMeshRef} 
          position={[0, 0, 0.02]}
          onClick={handleVinylClick}
          onPointerEnter={() => { if (onVinylClick) document.body.style.cursor = 'pointer' }}
          onPointerLeave={() => { document.body.style.cursor = 'default' }}
        >
          <circleGeometry args={[7, 64]} />
          <meshBasicMaterial 
            map={texture}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* Fallback colored disc if no texture - CLICKABLE */}
      {!texture && (
        <mesh 
          ref={artworkMeshRef} 
          position={[0, 0, 0.02]}
          onClick={handleVinylClick}
          onPointerEnter={() => { if (onVinylClick) document.body.style.cursor = 'pointer' }}
          onPointerLeave={() => { document.body.style.cursor = 'default' }}
        >
          <circleGeometry args={[7, 64]} />
          <meshBasicMaterial 
            color={accentColor}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Center label hole */}
      <mesh position={[0, 0, 0.03]}>
        <ringGeometry args={[0.3, 0.5, 32]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>

      {/* Center spindle hole (darker) */}
      <mesh position={[0, 0, 0.04]}>
        <circleGeometry args={[0.3, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Subtle glow ring around vinyl (accent color) */}
      <mesh position={[0, 0, -0.1]}>
        <ringGeometry args={[7.9, 8.2, 64]} />
        <meshBasicMaterial 
          color={accentColor}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
