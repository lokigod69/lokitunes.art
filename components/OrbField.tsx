'use client'

import { Suspense, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, PerformanceMonitor } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { EffectComposer, Bloom, ChromaticAberration, ToneMapping } from '@react-three/postprocessing'
import { KernelSize, ToneMappingMode } from 'postprocessing'
import { useRouter } from 'next/navigation'
import { BubbleOrb } from './BubbleOrb'
import { SonicOrb } from './SonicOrb'
import { InvisibleBounds } from './InvisibleBounds'
import { MouseAttraction } from './MouseAttraction'
import { PulsingWireframe } from './PulsingWireframe'
import type { Album } from '@/lib/supabase'
import { detectDeviceTier, getQualitySettings, type DeviceTier } from '@/lib/device-detection'
import { calculateOrbLayout, calculateCameraDistance } from '@/lib/orb-layout'

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
  
  // Calculate dynamic layout based on album count
  const { positions, radius } = calculateOrbLayout(albums.length)
  
  return (
    <Physics gravity={[0, 0, 0]} debug={true}>
      <Suspense fallback={null}>
        <group>
          {albums.map((album, index) => (
            <OrbComponent
              key={album.id}
              album={album}
              position={positions[index]}
              radius={radius}
              deviceTier={deviceTier}
              onHover={onHover}
              onNavigate={onNavigate}
            />
          ))}
        </group>
        
        {/* Mouse attraction - RED SPHERE should follow cursor */}
        <MouseAttraction />
        
        {/* Invisible physics boundaries */}
        <InvisibleBounds size={25} />
      </Suspense>
      
      {/* MULTI-LAYER NEON GRIDS - Cyberpunk aesthetic */}
      <gridHelper 
        args={[100, 50, '#00ffff', '#004444']}
        position={[0, -15, 0]} 
      />
      <gridHelper 
        args={[100, 50, '#ff00ff', '#440044']}
        position={[0, -14.5, 0]} 
        rotation={[0, Math.PI / 4, 0]}
      />
      <gridHelper 
        args={[100, 50, '#00ff88', '#004422']}
        position={[0, -14, 0]} 
        rotation={[0, -Math.PI / 4, 0]}
      />
      
      {/* DECORATIVE PULSING WIREFRAMES */}
      <PulsingWireframe position={[-10, 5, -10]} size={[3, 3, 3]} color="#ff00ff" />
      <PulsingWireframe position={[10, 5, -10]} size={[2, 4, 2]} color="#00ffff" />
      <PulsingWireframe position={[-10, -5, 10]} size={[4, 2, 4]} color="#00ff88" />
      <PulsingWireframe position={[10, -5, 10]} size={[3, 3, 3]} color="#ff00ff" />
      
      {/* Corner markers */}
      <PulsingWireframe position={[-15, 0, -15]} size={[1, 1, 1]} color="#ff0000" />
      <PulsingWireframe position={[15, 0, -15]} size={[1, 1, 1]} color="#ff0000" />
      <PulsingWireframe position={[-15, 0, 15]} size={[1, 1, 1]} color="#ff0000" />
      <PulsingWireframe position={[15, 0, 15]} size={[1, 1, 1]} color="#ff0000" />
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
    const settings = getQualitySettings(tier)
    setDpr(settings.dpr)
  }, [])
  
  // Calculate camera distance based on album count
  const cameraDistance = calculateCameraDistance(albums.length)

  const handleNavigate = (slug: string) => {
    router.push(`/album/${slug}`)
  }

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
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0
        }}
      >
        <PerformanceMonitor
          onDecline={() => {
            setDpr(prev => Math.max(1, prev * 0.9))
            if (dpr < 1.2) setUseGlassBubbles(false)
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
          albums={albums}
          onHover={setHoveredTitle}
          onNavigate={handleNavigate}
          deviceTier={deviceTier}
          useGlassBubbles={useGlassBubbles}
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

      {/* Fallback for no albums */}
      {albums.length === 0 && (
        <div className="fixed inset-0 flex items-center justify-center z-10">
          <p className="text-bone/50 text-lg">No albums available</p>
        </div>
      )}
    </>
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
