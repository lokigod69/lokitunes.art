'use client'

import { Suspense, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, PerformanceMonitor } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { EffectComposer, Bloom, ChromaticAberration, ToneMapping } from '@react-three/postprocessing'
import { KernelSize, ToneMappingMode } from 'postprocessing'
import { VersionOrb, type ExtendedVersion } from './VersionOrb'
import { InvisibleBounds } from './InvisibleBounds'
import { MouseAttraction } from './MouseAttraction'
import { detectDeviceTier, getQualitySettings, type DeviceTier } from '@/lib/device-detection'
import { calculateOrbLayout, calculateCameraDistance } from '@/lib/orb-layout'
import type { Album } from '@/lib/supabase'

interface VersionOrbFieldProps {
  versions: ExtendedVersion[]
  albumCoverUrl: string
  albumPalette: Album['palette']
}

function OrbScene({ 
  versions, 
  albumCoverUrl,
  albumPalette,
  onHover, 
  deviceTier 
}: {
  versions: ExtendedVersion[]
  albumCoverUrl: string
  albumPalette: Album['palette']
  onHover: (label: string | null) => void
  deviceTier: DeviceTier
}) {
  // Calculate dynamic layout based on version count
  const { positions, radius } = calculateOrbLayout(versions.length)
  
  console.log(`🎵 Rendering ${versions.length} version orbs with radius ${radius}`)
  
  return (
    <Physics gravity={[0, 0, 0]}>
      <Suspense fallback={null}>
        <group>
          {versions.map((version, index) => {
            console.log(`  Orb ${index + 1}: ${version.label}`)
            return (
              <VersionOrb
                key={version.id}
                version={version}
                position={positions[index]}
                radius={radius}
                deviceTier={deviceTier}
                albumPalette={albumPalette}
                albumCoverUrl={albumCoverUrl}
                onHover={onHover}
              />
            )
          })}
        </group>
        
        {/* Mouse attraction - RED SPHERE should follow cursor */}
        <MouseAttraction />
        
        {/* Invisible physics boundaries */}
        <InvisibleBounds size={25} />
      </Suspense>
      
      {/* MINIMAL GRID - Album page style (clean background) */}
      <gridHelper 
        args={[
          100,                                      // Size
          10,                                       // Divisions (fewer = cleaner)
          albumPalette?.accent1 || '#4F9EFF',      // Center lines (album accent color)
          (albumPalette?.dominant || '#090B0D') + '30'  // Grid lines (subtle)
        ]}
        position={[0, -15, 0]} 
      />
    </Physics>
  )
}

export function VersionOrbField({ 
  versions, 
  albumCoverUrl, 
  albumPalette 
}: VersionOrbFieldProps) {
  const [deviceTier, setDeviceTier] = useState<DeviceTier>('high')
  const [dpr, setDpr] = useState(1.5)
  
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
          onHover={() => {}}
          deviceTier={deviceTier}
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
