'use client'

import { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, PerformanceMonitor } from '@react-three/drei'
import { Physics, useRapier, RigidBody, BallCollider } from '@react-three/rapier'
import { EffectComposer, Bloom, ChromaticAberration, ToneMapping } from '@react-three/postprocessing'
import { KernelSize, ToneMappingMode } from 'postprocessing'
import { VersionOrb, type ExtendedVersion } from './VersionOrb'
import { InvisibleBounds } from './InvisibleBounds'
import { MouseAttraction } from './MouseAttraction'
import { AlbumGridTextDisplay } from './AlbumGridTextDisplay'
import { AlbumArtworkDisplay } from './AlbumArtworkDisplay'
import { detectDeviceTier, getQualitySettings, type DeviceTier } from '@/lib/device-detection'
import { calculateOrbLayout, calculateCameraDistance } from '@/lib/orb-layout'
import type { Album } from '@/lib/supabase'
import { useAudioStore } from '@/lib/audio-store'
import { devLog, devWarn } from '@/lib/debug'

interface VersionOrbFieldProps {
  versions: ExtendedVersion[]
  albumCoverUrl: string
  albumPalette: Album['palette']
  isMobile?: boolean
}

// 🧹 VERIFICATION COMPONENT - Confirms physics world is clean (no ghost orbs)
function PhysicsCleanup({ expectedCount }: { expectedCount: number }) {
  const { world } = useRapier()
  
  useEffect(() => {
    // Delay check to ensure all orbs have mounted
    const timer = setTimeout(() => {
      const actualCount = world.bodies.len()
      devLog(`🧹 Physics World Health Check:`)
      devLog(`   Expected: ${expectedCount} orbs`)
      devLog(`   Actual: ${actualCount} rigid bodies`)
      
      if (actualCount === expectedCount) {
        devLog(`✅ PERFECT! Physics world is clean - no ghost orbs!`)
      } else if (actualCount > expectedCount) {
        devLog(`🚨 WARNING: ${actualCount - expectedCount} extra rigid bodies detected!`)
        devLog(`   This suggests ghost orbs still exist - Physics key may not be working`)
      } else {
        devLog(`⚠️ FEWER bodies than expected - orbs may still be mounting`)
      }
    }, 1000) // Wait 1 second for orbs to mount
    
    return () => clearTimeout(timer)
  }, [world, expectedCount])
  
  return null
}

// Vinyl position - moved to TOP of scene, above the orbs
// Scale is calculated dynamically based on camera distance for consistent visual size
const VINYL_CONFIG = {
  positionY: 5,       // High up - in the black space above orbs
  positionZ: -8,      // Slightly back but visible
  baseScale: 0.5,     // Base scale at reference camera distance
  referenceDistance: 25, // Reference camera distance for scale calculation
} as const

// Calculate vinyl scale to maintain consistent visual size regardless of camera distance
function calculateVinylScale(cameraDistance: number): number {
  // Scale proportionally to camera distance so vinyl appears same size on screen
  return VINYL_CONFIG.baseScale * (cameraDistance / VINYL_CONFIG.referenceDistance)
}

const VINYL_CENTER_POSITION: [number, number, number] = [0, VINYL_CONFIG.positionY, VINYL_CONFIG.positionZ]

// FIXED GRID CONFIG - Consistent across ALL albums regardless of orb count
// This ensures visual consistency: ~10% black space at front, text in front of grid
const GRID_CONFIG = {
  // Grid settings - FIXED for all albums
  size: { mobile: 50, desktop: 80 },
  divisions: { mobile: 25, desktop: 40 },
  positionY: -13,
  positionZ: { mobile: -15, desktop: -10 },  // Grid pushed back
  
  // Text should be in FRONT of grid but within container bounds
  // These are now defined in AlbumGridTextDisplay.tsx
} as const

// No longer need center barrier - vinyl is now above the orbs, not in front
// Orbs have the center space to themselves

function OrbScene({ 
  versions, 
  albumCoverUrl,
  albumPalette,
  hoveredVersion,
  playingVersion,
  onHover, 
  deviceTier,
  onStopPlaying,
  isMobile = false,
  cameraDistance = 25
}: {
  versions: ExtendedVersion[]
  albumCoverUrl: string
  albumPalette: Album['palette']
  hoveredVersion: ExtendedVersion | null
  playingVersion: ExtendedVersion | null
  onHover: (version: ExtendedVersion | null) => void
  deviceTier: DeviceTier
  onStopPlaying: () => void
  isMobile?: boolean
  cameraDistance?: number
}) {
  // Calculate vinyl scale based on camera distance for consistent appearance
  const vinylScale = calculateVinylScale(cameraDistance)
  // Calculate dynamic layout based on version count (with mobile scaling)
  const { positions, radius } = calculateOrbLayout(versions.length, isMobile)

  // Normalize grid opacity across albums
  const gridRef = useRef<any>(null)

  useEffect(() => {
    if (!gridRef.current) return
    const material: any = (gridRef.current as any).material

    const baseOpacity = isMobile ? 0.12 : 0.18

    if (Array.isArray(material)) {
      material.forEach((m: any) => {
        m.transparent = true
        m.opacity = baseOpacity
      })
    } else if (material) {
      material.transparent = true
      material.opacity = baseOpacity
    }
  }, [isMobile])

  // 🧹 NUCLEAR GHOST FIX: Force Physics world to remount when versions change
  // This clears ALL rigid bodies and prevents ghost orbs from deleted tracks
  const physicsKey = versions.map(v => v.id).sort().join('-')
  
  devLog(`🎵 Rendering ${versions.length} version orbs with radius ${radius}`)
  devLog(`🧹 Physics World Key: ${physicsKey.slice(0, 30)}... (forces remount on version changes)`)
  
  return (
    <Physics key={physicsKey} gravity={[0, 0, 0]}>
      <Suspense fallback={null}>
        <group>
          {versions.map((version, index) => {
            devLog(`  Orb ${index + 1}: ${version.label}`)
            return (
              <VersionOrb
                key={version.id}
                version={version}
                allVersions={versions}
                position={positions[index]}
                radius={radius}
                orbCount={versions.length}
                orbIndex={index}
                deviceTier={deviceTier}
                albumPalette={albumPalette}
                albumCoverUrl={albumCoverUrl}
                onHover={onHover}
                vinylCenterPosition={VINYL_CENTER_POSITION}
                isVinylVisible={!!(hoveredVersion || playingVersion)}
                isMobile={isMobile}
              />
            )
          })}
        </group>
        
        {/* 🧹 Clean up ghost rigid bodies from deleted tracks */}
        <PhysicsCleanup expectedCount={versions.length} />
        
        {/* Mouse attraction - Dynamic range for large albums */}
        <MouseAttraction albumCount={versions.length} />
        
        {/* Invisible physics boundaries - adjusts when vinyl is visible */}
        <InvisibleBounds size={25} isPlaying={!!(hoveredVersion || playingVersion)} />
      </Suspense>
      
      {/* CENTERED GRID TEXT - Shows hovered or playing version label on album grid */}
      <AlbumGridTextDisplay 
        hoveredVersion={hoveredVersion}
        playingVersion={playingVersion}
        albumPalette={albumPalette}
      />
      
      {/* ALBUM GRID - FIXED position for consistency across all albums */}
      {/* Mobile: perspective road effect starting from bottom corners */}
      {/* Desktop: flat horizontal grid */}
      {(() => {
        const gridColor = (isMobile ? '#4F9EFF' : (albumPalette?.accent1 || '#4F9EFF')).slice(0, 7)
        
        if (isMobile) {
          // Mobile: tilted grid for road/perspective effect
          return (
            <gridHelper 
              ref={gridRef}
              args={[80, 40, gridColor, gridColor]}
              position={[0, -6, 8]}
              rotation={[Math.PI * 0.4, 0, 0]}  // ~72° tilt for road perspective
            />
          )
        }
        
        // Desktop: flat horizontal grid
        return (
          <gridHelper 
            ref={gridRef}
            args={[
              GRID_CONFIG.size.desktop,
              GRID_CONFIG.divisions.desktop,
              gridColor,
              gridColor
            ]}
            position={[0, GRID_CONFIG.positionY, GRID_CONFIG.positionZ.desktop]}
          />
        )
      })()}
      
      {/* VINYL ARTWORK DISPLAY - Now at TOP of scene, above orbs */}
      <AlbumArtworkDisplay
        albumCoverUrl={hoveredVersion?.cover_url || playingVersion?.cover_url || albumCoverUrl}
        albumPalette={albumPalette}
        visible={!!(hoveredVersion || playingVersion)}
        position={VINYL_CENTER_POSITION}
        scale={vinylScale}
        albumTitle={hoveredVersion?.label || playingVersion?.label || 'Album'}
        onVinylClick={playingVersion ? onStopPlaying : undefined}
        isPlaying={!!playingVersion}
        deviceTier={deviceTier}
      />
    </Physics>
  )
}

export function VersionOrbField({ 
  versions, 
  albumCoverUrl, 
  albumPalette,
  isMobile = false
}: VersionOrbFieldProps) {
  // 🔥 DEBUG: Log palette received by VersionOrbField
  devLog('🔥 VersionOrbField received palette:', {
    palette: albumPalette,
    dominant: albumPalette?.dominant,
    dominantLength: albumPalette?.dominant?.length,
    accent1: albumPalette?.accent1,
    accent1Length: albumPalette?.accent1?.length,
  })

  const [deviceTier, setDeviceTier] = useState<DeviceTier>('high')
  const [dpr, setDpr] = useState(1.5)
  const [canvasKey, setCanvasKey] = useState(0)
  const [hoveredVersion, setHoveredVersion] = useState<ExtendedVersion | null>(null)

  // Global audio store - currently playing version
  const { currentVersion, isPlaying, stop } = useAudioStore()

  // Map current playing SongVersion to ExtendedVersion from this album page
  // Fallback: if currentVersion has ExtendedVersion fields, use it directly
  const playingVersion: ExtendedVersion | null = (isPlaying && currentVersion)
    ? (versions.find(v => v.id === currentVersion.id) || 
       // Fallback: currentVersion might already be an ExtendedVersion from queue
       ((currentVersion as any).songTitle ? currentVersion as unknown as ExtendedVersion : null))
    : null

  const quality = getQualitySettings(deviceTier)

  useEffect(() => {
    const tier = detectDeviceTier()
    setDeviceTier(tier)
    const settings = getQualitySettings(tier)
    setDpr(settings.dpr)
  }, [])
  
  // Calculate aspect ratio for camera distance adjustment
  const [aspectRatio, setAspectRatio] = useState(16/9)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateAspectRatio = () => {
        setAspectRatio(window.innerWidth / window.innerHeight)
      }
      updateAspectRatio()
      window.addEventListener('resize', updateAspectRatio)
      return () => window.removeEventListener('resize', updateAspectRatio)
    }
  }, [])
  
  // Calculate camera distance based on version count, mobile state, and aspect ratio
  const cameraDistance = calculateCameraDistance(versions.length, isMobile, aspectRatio)
  
  devLog(`📷 Camera distance for ${versions.length} versions: ${cameraDistance} (mobile: ${isMobile}, aspect: ${aspectRatio.toFixed(2)})`)

  // Pointer event handlers to ensure touch events are captured for orb attraction
  const [isPointerActive, setIsPointerActive] = useState(false)
  
  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    setIsPointerActive(true)
  }, [])
  
  const handlePointerUp = useCallback(() => {
    setIsPointerActive(false)
  }, [])
  
  const handlePointerLeave = useCallback(() => {
    setIsPointerActive(false)
  }, [])

  return (
    <>
      {/* 3D Canvas - Fullscreen */}
      <Canvas
        key={canvasKey}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        dpr={isMobile ? Math.min(dpr, 1) : dpr}
        camera={{ 
          position: [0, 0, cameraDistance],
          fov: 50,
          near: 0.1,
          far: 200
        }}
        gl={{ 
          alpha: false,
          antialias: !isMobile,
          powerPreference: isMobile ? 'low-power' : 'high-performance',
          failIfMajorPerformanceCaveat: false
        }}
        onCreated={({ gl }) => {
          const canvas = gl.domElement

          const onLost = (event: any) => {
            event.preventDefault?.()
            devWarn('WebGL context lost (VersionOrbField).')
          }

          const onRestored = () => {
            devLog('WebGL context restored (VersionOrbField).')
            setCanvasKey((k) => k + 1)
          }

          canvas.addEventListener('webglcontextlost', onLost)
          canvas.addEventListener('webglcontextrestored', onRestored)
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          touchAction: 'pan-y'  // Allow vertical scroll, capture horizontal/drag for orb physics
        }}
      >
        <PerformanceMonitor
          onDecline={() => {
            setDpr(prev => Math.max(1, prev * 0.9))
          }}
        />
        
        <color attach="background" args={['#0a0b0d']} />
        
        {/* NEON COLORED LIGHTS - Cyberpunk aesthetic */}
        <ambientLight intensity={0.3} color="#0a0a2e" />
        <directionalLight position={[10, 10, 5]} intensity={0.8} color="#00ffff" />
        <directionalLight position={[-10, 5, -5]} intensity={0.5} color="#ff00ff" />
        <pointLight position={[0, 10, 0]} intensity={1} color="#00ff88" />
        
        <Environment preset="night" />
        
        <OrbScene
          versions={versions}
          albumCoverUrl={albumCoverUrl}
          albumPalette={albumPalette}
          hoveredVersion={hoveredVersion}
          playingVersion={playingVersion}
          onHover={setHoveredVersion}
          deviceTier={deviceTier}
          onStopPlaying={stop}
          isMobile={isMobile}
          cameraDistance={cameraDistance}
        />
        
        {/* Post-processing effects - reduced on mobile to avoid GPU context loss */}
        {!isMobile ? (
          <EffectComposer multisampling={quality.multisampling}>
            <Bloom
              intensity={quality.bloomIntensity}
              luminanceThreshold={0.9}
              luminanceSmoothing={0.025}
              mipmapBlur={true}
              kernelSize={KernelSize.LARGE}
            />
            <ChromaticAberration
              offset={deviceTier === 'low' ? [0, 0] : [0.002, 0.001]}
              radialModulation={deviceTier !== 'low'}
            />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        ) : (
          <EffectComposer multisampling={0}>
            <Bloom
              intensity={0.3}
              luminanceThreshold={0.98}
              luminanceSmoothing={0.1}
              mipmapBlur={false}
              kernelSize={KernelSize.SMALL}
            />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        )}
      </Canvas>

      {/* Fallback for no versions */}
      {versions.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <p className="text-bone/50 text-lg">No versions available</p>
        </div>
      )}
    </>
  )
}
