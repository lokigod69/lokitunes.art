'use client'

import { Suspense, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, PerformanceMonitor } from '@react-three/drei'
import { Physics, CuboidCollider } from '@react-three/rapier'
import { EffectComposer, Bloom, ChromaticAberration, ToneMapping } from '@react-three/postprocessing'
import { KernelSize, ToneMappingMode } from 'postprocessing'
import { useRouter } from 'next/navigation'
import { BubbleOrb } from './BubbleOrb'
import { SonicOrb } from './SonicOrb'
import type { Album } from '@/lib/supabase'
import { detectDeviceTier, getQualitySettings, type DeviceTier } from '@/lib/device-detection'

interface OrbFieldProps {
  albums: Album[]
}

function OrbScene({ albums, onHover, onNavigate, deviceTier, useGlassBubbles }: {
  albums: Album[]
  onHover: (title: string | null) => void
  onNavigate: (slug: string) => void
  deviceTier: DeviceTier
  useGlassBubbles: boolean
}) {
  const OrbComponent = useGlassBubbles ? BubbleOrb : SonicOrb
  
  return (
    <Physics gravity={[0, 0, 0]}>
      <group>
        {/* Keep orbs centered and bounded */}
        <group position={[0, 0, 0]}>
          {albums.map((album, index) => (
            <OrbComponent
              key={album.id}
              album={album}
              index={index}
              totalCount={albums.length}
              deviceTier={deviceTier}
              onHover={onHover}
              onNavigate={onNavigate}
            />
          ))}
        </group>
        
        {/* Invisible bounds - SMALLER so orbs stay in view */}
        {/* Top */}
        <CuboidCollider position={[0, 5, 0]} args={[15, 0.1, 3]} />
        {/* Bottom */}
        <CuboidCollider position={[0, -5, 0]} args={[15, 0.1, 3]} />
        {/* Left */}
        <CuboidCollider position={[-8, 0, 0]} args={[0.1, 8, 3]} />
        {/* Right */}
        <CuboidCollider position={[8, 0, 0]} args={[0.1, 8, 3]} />
      </group>
    </Physics>
  )
}

export function OrbField({ albums }: OrbFieldProps) {
  const router = useRouter()
  const [hoveredTitle, setHoveredTitle] = useState<string | null>(null)
  const [deviceTier, setDeviceTier] = useState<DeviceTier>('high')
  const [dpr, setDpr] = useState(1.5)
  const [useGlassBubbles, setUseGlassBubbles] = useState(true)
  
  const quality = getQualitySettings(deviceTier)

  useEffect(() => {
    const tier = detectDeviceTier()
    setDeviceTier(tier)
    setDpr(quality.dpr)
  }, [])

  const handleNavigate = (slug: string) => {
    router.push(`/album/${slug}`)
  }

  return (
    <div className="relative w-full" style={{ minHeight: '100vh' }}>
      {/* 3D Canvas */}
      <Canvas
        dpr={dpr}
        camera={{ 
          position: [0, 0, 20],
          fov: 40,
          near: 0.1,
          far: 100
        }}
        gl={{ 
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance'
        }}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      >
        <PerformanceMonitor
          onDecline={() => {
            setDpr(prev => Math.max(1, prev * 0.9))
            if (dpr < 1.2) setUseGlassBubbles(false)
          }}
        />
        
        <color attach="background" args={['#0a0b0d']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.0} />
        <Environment preset="sunset" />
        
        <Suspense fallback={null}>
          <OrbScene
            albums={albums}
            onHover={setHoveredTitle}
            onNavigate={handleNavigate}
            deviceTier={deviceTier}
            useGlassBubbles={useGlassBubbles}
          />
        </Suspense>
        
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

      {/* Hover label */}
      {hoveredTitle && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-void/80 backdrop-blur-sm px-6 py-3 rounded-full border border-voltage/30">
            <p className="text-bone text-lg font-medium">{hoveredTitle}</p>
          </div>
        </div>
      )}

      {/* Fallback for no albums */}
      {albums.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-bone/50 text-lg">No albums available</p>
        </div>
      )}
    </div>
  )
}

// Static fallback for reduced motion or no WebGL
export function OrbFieldFallback({ albums }: OrbFieldProps) {
  const router = useRouter()

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-8">
      {albums.map((album) => (
        <button
          key={album.id}
          onClick={() => router.push(`/album/${album.slug}`)}
          className="group relative aspect-square rounded-full overflow-hidden transition-transform hover:scale-105 focus-visible:scale-105"
          aria-label={`Album: ${album.title}, ${album.total_versions || 0} versions`}
        >
          {album.cover_url && (
            <img
              src={album.cover_url}
              alt={album.title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-void/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
            <p className="text-bone text-sm font-medium text-center">
              {album.title}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}
