'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
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

interface VersionOrbFieldProps {
  versions: ExtendedVersion[]
  albumCoverUrl: string
  albumPalette: Album['palette']
}

// 🧹 VERIFICATION COMPONENT - Confirms physics world is clean (no ghost orbs)
function PhysicsCleanup({ expectedCount }: { expectedCount: number }) {
  const { world } = useRapier()
  
  useEffect(() => {
    // Delay check to ensure all orbs have mounted
    const timer = setTimeout(() => {
      const actualCount = world.bodies.len()
      console.log(`🧹 Physics World Health Check:`)
      console.log(`   Expected: ${expectedCount} orbs`)
      console.log(`   Actual: ${actualCount} rigid bodies`)
      
      if (actualCount === expectedCount) {
        console.log(`✅ PERFECT! Physics world is clean - no ghost orbs!`)
      } else if (actualCount > expectedCount) {
        console.log(`🚨 WARNING: ${actualCount - expectedCount} extra rigid bodies detected!`)
        console.log(`   This suggests ghost orbs still exist - Physics key may not be working`)
      } else {
        console.log(`⚠️ FEWER bodies than expected - orbs may still be mounting`)
      }
    }, 1000) // Wait 1 second for orbs to mount
    
    return () => clearTimeout(timer)
  }, [world, expectedCount])
  
  return null
}

// Vinyl center position constant - where orbs dock to
const VINYL_CENTER_POSITION: [number, number, number] = [0, 0, -35]

// Invisible physics barrier that orbs bounce off when vinyl is visible
// Sized to match the docked orb (20% scale of original ~3.5 radius = ~0.7)
function VinylPhysicsBarrier({ visible }: { visible: boolean }) {
  if (!visible) return null
  
  // Docked orb is 20% of original size (~3.5 * 0.2 = 0.7 radius)
  // Barrier needs to prevent orbs from overlapping with docked area
  // 3.2 was still allowing a tiny overlap, so we nudge it up slightly again
  const DOCKED_ORB_RADIUS = 3.5  // Final tuned radius so orbs clear the vinyl nicely
  
  return (
    <RigidBody
      type="fixed"
      position={[0, 0, 0]}  // At center where docked orb appears
      colliders={false}
    >
      {/* Invisible sphere matching docked orb size */}
      <BallCollider args={[DOCKED_ORB_RADIUS]} restitution={0.8} friction={0.0} />
    </RigidBody>
  )
}

function OrbScene({ 
  versions, 
  albumCoverUrl,
  albumPalette,
  hoveredVersion,
  playingVersion,
  onHover, 
  deviceTier,
  onStopPlaying  // NEW: Callback to stop playing (releases docked orb)
}: {
  versions: ExtendedVersion[]
  albumCoverUrl: string
  albumPalette: Album['palette']
  hoveredVersion: ExtendedVersion | null
  playingVersion: ExtendedVersion | null
  onHover: (version: ExtendedVersion | null) => void
  deviceTier: DeviceTier
  onStopPlaying: () => void  // NEW
}) {
  // Calculate dynamic layout based on version count
  const { positions, radius } = calculateOrbLayout(versions.length)

  // Normalize grid opacity across albums
  const gridRef = useRef<any>(null)

  useEffect(() => {
    if (!gridRef.current) return
    const material: any = (gridRef.current as any).material

    if (Array.isArray(material)) {
      material.forEach((m: any) => {
        m.transparent = true
        m.opacity = 0.18
      })
    } else if (material) {
      material.transparent = true
      material.opacity = 0.18
    }
  }, [])

  // 🧹 NUCLEAR GHOST FIX: Force Physics world to remount when versions change
  // This clears ALL rigid bodies and prevents ghost orbs from deleted tracks
  const physicsKey = versions.map(v => v.id).sort().join('-')
  
  console.log(`🎵 Rendering ${versions.length} version orbs with radius ${radius}`)
  console.log(`🧹 Physics World Key: ${physicsKey.slice(0, 30)}... (forces remount on version changes)`)
  
  return (
    <Physics key={physicsKey} gravity={[0, 0, 0]}>
      <Suspense fallback={null}>
        <group>
          {versions.map((version, index) => {
            console.log(`  Orb ${index + 1}: ${version.label}`)
            return (
              <VersionOrb
                key={version.id}
                version={version}
                allVersions={versions}
                position={positions[index]}
                radius={radius}
                orbCount={versions.length}
                deviceTier={deviceTier}
                albumPalette={albumPalette}
                albumCoverUrl={albumCoverUrl}
                onHover={onHover}
                vinylCenterPosition={VINYL_CENTER_POSITION}
                isVinylVisible={!!(hoveredVersion || playingVersion)}
              />
            )
          })}
        </group>
        
        {/* 🧹 Clean up ghost rigid bodies from deleted tracks */}
        <PhysicsCleanup expectedCount={versions.length} />
        
        {/* Mouse attraction - Dynamic range for large albums */}
        <MouseAttraction albumCount={versions.length} />
        
        {/* Invisible physics boundaries */}
        <InvisibleBounds size={25} />
        
        {/* 🎵 VINYL PHYSICS BARRIER - Invisible collider at center that orbs bounce off */}
        <VinylPhysicsBarrier visible={!!playingVersion} />
      </Suspense>
      
      {/* CENTERED GRID TEXT - Shows hovered or playing version label on album grid */}
      <AlbumGridTextDisplay 
        hoveredVersion={hoveredVersion}
        playingVersion={playingVersion}
        albumPalette={albumPalette}
      />
      
      {/* MINIMAL GRID - Album page style (clean background) */}
      <gridHelper 
        ref={gridRef}
        args={[
          100,                                      // Size
          10,                                       // Divisions (fewer = cleaner)
          (albumPalette?.accent1 || '#4F9EFF').slice(0, 7),      // Center lines (album accent)
          (albumPalette?.accent1 || '#4F9EFF').slice(0, 7)      // Grid lines (album dominant) - NO ALPHA!
        ]}
        position={[0, -15, 0]} 
      />
      
      {/* VINYL ARTWORK DISPLAY - Standing at back of grid, shows on hover or when playing */}
      <AlbumArtworkDisplay
        albumCoverUrl={hoveredVersion?.cover_url || playingVersion?.cover_url || albumCoverUrl}
        albumPalette={albumPalette}
        visible={!!(hoveredVersion || playingVersion)}
        position={VINYL_CENTER_POSITION}
        albumTitle={hoveredVersion?.label || playingVersion?.label || 'Album'}
        onVinylClick={playingVersion ? onStopPlaying : undefined}
        isPlaying={!!playingVersion}
      />
    </Physics>
  )
}

export function VersionOrbField({ 
  versions, 
  albumCoverUrl, 
  albumPalette 
}: VersionOrbFieldProps) {
  // 🔥 DEBUG: Log palette received by VersionOrbField
  console.log('🔥 VersionOrbField received palette:', {
    palette: albumPalette,
    dominant: albumPalette?.dominant,
    dominantLength: albumPalette?.dominant?.length,
    accent1: albumPalette?.accent1,
    accent1Length: albumPalette?.accent1?.length,
  })

  const [deviceTier, setDeviceTier] = useState<DeviceTier>('high')
  const [dpr, setDpr] = useState(1.5)
  const [hoveredVersion, setHoveredVersion] = useState<ExtendedVersion | null>(null)

  // Global audio store - currently playing version
  const { currentVersion, isPlaying, stop } = useAudioStore()

  // Map current playing SongVersion to ExtendedVersion from this album page
  const playingVersion: ExtendedVersion | null = (isPlaying && currentVersion)
    ? (versions.find(v => v.id === currentVersion.id) || null)
    : null

  const quality = getQualitySettings(deviceTier)

  useEffect(() => {
    const tier = detectDeviceTier()
    setDeviceTier(tier)
    const settings = getQualitySettings(tier)
    setDpr(settings.dpr)
  }, [])
  
  // Calculate camera distance based on version count
  const cameraDistance = calculateCameraDistance(versions.length)
  
  console.log(`📷 Camera distance for ${versions.length} versions: ${cameraDistance}`)

  return (
    <>
      {/* 3D Canvas - Fullscreen */}
      <Canvas
        dpr={dpr}
        camera={{ 
          position: [0, 0, cameraDistance],
          fov: 50,
          near: 0.1,
          far: 200
        }}
        gl={{ 
          alpha: false,
          antialias: true,
          powerPreference: 'high-performance'
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0
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
        />
        
        {/* Post-processing effects */}
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
