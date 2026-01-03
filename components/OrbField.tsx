'use client'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
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
import { InfoDisplayCube } from './InfoDisplayCube'
import { GridTextDisplay } from './GridTextDisplay'
import { NeonHeader } from './NeonHeader'
import { ObstacleField } from './ObstacleField'
import { BurstManager } from './BurstManager'
import { usePlayMode } from '@/hooks/usePlayMode'
import type { Album } from '@/lib/supabase'
import { detectDeviceTier, getQualitySettings, type DeviceTier } from '@/lib/device-detection'
import { calculateOrbLayout, calculateCameraDistance, calculateOrbScale } from '@/lib/orb-layout'
import type { RapierRigidBody } from '@react-three/rapier'
import { devLog, devWarn } from '@/lib/debug'

interface OrbFieldProps {
  albums: Album[]
  isMobile?: boolean
}

function OrbScene({ albums, pushTrigger, onHover, onNavigate, deviceTier, useGlassBubbles, onRegisterRigidBody, onReset, hoveredAlbum, isMobile = false, allBodiesRef }: {
  albums: Album[]
  pushTrigger: number
  onHover: (title: string | null) => void
  onNavigate: (slug: string) => void
  deviceTier: DeviceTier
  useGlassBubbles: boolean
  onRegisterRigidBody: (id: string, body: RapierRigidBody, initialPos: [number, number, number]) => void
  onReset: number
  hoveredAlbum: Album | null
  isMobile?: boolean
  allBodiesRef: React.RefObject<Map<string, { body: RapierRigidBody, initialPos: [number, number, number] }> | null>
}) {
  const OrbComponent = useGlassBubbles ? BubbleOrb : SonicOrb
  const { isActive: playModeActive, bursts, removeBurst } = usePlayMode()
  
  // Calculate dynamic layout based on album count
  const { positions, radius } = calculateOrbLayout(albums.length, isMobile)
  const orbRadius = radius * (isMobile ? 0.95 : 0.8)
  
  return (
    <Physics gravity={[0, 0, 0]}>
      <Suspense fallback={null}>
        <group>
          {albums.map((album, index) => (
            <OrbComponent
              key={album.id}
              album={album}
              pushTrigger={pushTrigger}
              position={positions[index]}
              radius={orbRadius}
              visualScale={calculateOrbScale(album.total_versions || 1)}
              deviceTier={deviceTier}
              onHover={onHover}
              onNavigate={onNavigate}
              onRegisterRigidBody={(body) => onRegisterRigidBody(album.id, body, positions[index])}
              resetTrigger={onReset}
              orbIndex={index}
              allBodiesRef={allBodiesRef}
            />
          ))}
        </group>
        
        {/* Mouse attraction - Dynamic range for large collections */}
        {isMobile ? (
          <MouseAttraction albumCount={albums.length} targetPlaneZ={0} />
        ) : (
          <MouseAttraction
            albumCount={albums.length}
            targetPlaneZ={0}
            baselineStrength={0.05}
            strengthScale={0.55}
            speedFull={14}
            accelFull={180}
          />
        )}
        
        {/* Invisible physics boundaries */}
        <InvisibleBounds size={25} />

        {/* SOPHISTICATED NEON HEADER - 3D (Bigger, Higher, Forward) */}
        <NeonHeader />
      </Suspense>
      
      {/* MULTI-LAYER NEON GRIDS - Cyberpunk aesthetic */}
      {/* Mobile: narrower grids (50 units) shifted back for portrait depth */}
      <gridHelper 
        args={[isMobile ? 50 : 100, isMobile ? 25 : 50, '#00ffff', '#002244']}
        position={[0, -15, isMobile ? -15 : 0]} 
      />
      <gridHelper 
        args={[isMobile ? 50 : 100, isMobile ? 25 : 50, '#ff00ff', '#440044']}
        position={[0, -14.5, isMobile ? -15 : 0]} 
        rotation={[0, Math.PI / 4, 0]}
      />
      <gridHelper 
        args={[isMobile ? 50 : 100, isMobile ? 25 : 50, '#00ff88', '#004422']}
        position={[0, -14, isMobile ? -15 : 0]} 
        rotation={[0, -Math.PI / 4, 0]}
      />
      
      {/* GRID TEXT DISPLAY - Shows album name on floor when hovering */}
      <GridTextDisplay 
        album={hoveredAlbum}
        visible={!!hoveredAlbum}
        isMobile={isMobile}
      />
      
      {/* OBSTACLE FIELD - Rainbow obstacles for play mode */}
      <ObstacleField />
      
      {/* BURST EFFECTS - Particle explosions when orbs are destroyed */}
      <BurstManager bursts={bursts} onBurstComplete={removeBurst} />
      
      {/* DECORATIVE PULSING WIREFRAMES - Hide during play mode */}
      {!playModeActive && (
        <>
          <PulsingWireframe 
            position={isMobile ? [0, 3, -25] : [-10, 5, -10]} 
            size={isMobile ? [2, 2, 2] : [3, 3, 3]} 
            color="#ff00ff" 
            hoveredAlbum={hoveredAlbum} 
          />
          <PulsingWireframe 
            position={isMobile ? [0, -3, -28] : [10, 5, -10]} 
            size={isMobile ? [1.5, 3, 1.5] : [2, 4, 2]} 
            color="#00ffff" 
            hoveredAlbum={hoveredAlbum} 
          />
        </>
      )}
      
      {/* INFO DISPLAY CUBES - Hide during play mode */}
      {!playModeActive && (
        <>
          <InfoDisplayCube 
            position={isMobile ? [-3, 0, -30] : [-10, -5, 10]} 
            size={isMobile ? [2, 1, 2] : [4, 2, 4]} 
            baseColor="#00ff88" 
            hoveredAlbum={hoveredAlbum} 
          />
          <InfoDisplayCube 
            position={isMobile ? [3, 0, -32] : [10, -5, 10]} 
            size={isMobile ? [1.5, 1.5, 1.5] : [3, 3, 3]} 
            baseColor="#ff00ff" 
            hoveredAlbum={hoveredAlbum} 
          />
        </>
      )}
      
      {/* CORNER MARKERS - Hide on mobile and during play mode */}
      {!isMobile && !playModeActive && (
        <>
          <PulsingWireframe position={[-15, 0, -15]} size={[1, 1, 1]} color="#ff0000" hoveredAlbum={hoveredAlbum} />
          <PulsingWireframe position={[15, 0, -15]} size={[1, 1, 1]} color="#ff0000" hoveredAlbum={hoveredAlbum} />
          <PulsingWireframe position={[-15, 0, 15]} size={[1, 1, 1]} color="#ff0000" hoveredAlbum={hoveredAlbum} />
          <PulsingWireframe position={[15, 0, 15]} size={[1, 1, 1]} color="#ff0000" hoveredAlbum={hoveredAlbum} />
        </>
      )}
    </Physics>
  )
}

export function OrbField({ albums, isMobile = false }: OrbFieldProps) {
  const router = useRouter()
  const [hoveredTitle, setHoveredTitle] = useState<string | null>(null)
  const [hoveredAlbum, setHoveredAlbum] = useState<Album | null>(null)
  const [deviceTier, setDeviceTier] = useState<DeviceTier>('high')
  const [dpr, setDpr] = useState(1.5)
  const [canvasKey, setCanvasKey] = useState(0)
  const [useGlassBubbles, setUseGlassBubbles] = useState(true)
  const [pushTrigger, setPushTrigger] = useState(0)
  const [resetTrigger, setResetTrigger] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  
  // Play mode - set total orbs count
  const { setTotalOrbs, isActive: playModeActive, stopGame } = usePlayMode()

  devLog('OrbField rendering with albums:', albums.length)
  
  useEffect(() => {
    devLog('[OrbField] useGlassBubbles changed:', useGlassBubbles)
  }, [useGlassBubbles])
  
  // Track rigid bodies and their initial positions
  const rigidBodies = useRef(new Map<string, { body: RapierRigidBody, initialPos: [number, number, number] }>())
  const autoClickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isPointerDownRef = useRef(false)
  
  const quality = getQualitySettings(deviceTier)

  useEffect(() => {
    const tier = detectDeviceTier()
    setDeviceTier(tier)
    const settings = getQualitySettings(tier)
    setDpr(settings.dpr)
  }, [])
  
  // Set total orbs for play mode when albums change
  useEffect(() => {
    setTotalOrbs(albums.length)
  }, [albums.length, setTotalOrbs])
  
  // Track previous play mode state to detect when game stops
  const prevPlayModeActive = useRef(playModeActive)
  useEffect(() => {
    // Reset orbs when play mode ends
    if (prevPlayModeActive.current && !playModeActive) {
      devLog('🎮 Play mode ended - resetting orbs')
      rigidBodies.current.forEach(({ body, initialPos }, id) => {
        try {
          // Check if body is still valid before operating on it
          body.translation()  // This will throw if body is invalid
          
          body.setTranslation({ x: initialPos[0], y: initialPos[1], z: initialPos[2] }, true)
          body.setLinvel({ x: 0, y: 0, z: 0 }, true)
          body.setAngvel({ x: 0, y: 0, z: 0 }, true)
          body.wakeUp()
        } catch (e) {
          // Body no longer exists or is invalid, skip it
          devLog(`⚠️ Skipping invalid body during reset: ${id}`)
        }
      })
      setResetTrigger(prev => prev + 1)
    }
    prevPlayModeActive.current = playModeActive
  }, [playModeActive])
  
  // Calculate camera distance based on album count
  // For the homepage we pull the camera back slightly more so the grid
  // and RESET button sit higher above the global player bar.
  const cameraDistance = calculateCameraDistance(albums.length) * 1.12

  const handleNavigate = useCallback((slug: string) => {
    // Find the clicked album to identify its rigid body
    const clickedAlbum = albums.find(a => a.slug === slug)
    const clickedId = clickedAlbum?.id
    
    devLog('🎯 handleNavigate called:', slug, 'clickedId:', clickedId)
    devLog('🎯 rigidBodies count:', rigidBodies.current.size)
    
    // Scatter all OTHER orbs violently, freeze the clicked one
    rigidBodies.current.forEach(({ body }, id) => {
      try {
        // Check if body is still valid
        body.translation()
        
        if (id === clickedId) {
          // FREEZE the clicked orb - stop all movement
          devLog('❄️ Freezing clicked orb:', id)
          body.setLinvel({ x: 0, y: 0, z: 0 }, true)
          body.setAngvel({ x: 0, y: 0, z: 0 }, true)
        } else {
          // SCATTER other orbs - use setLinvel for immediate velocity change
          const speed = 50 + Math.random() * 30  // Very fast 50-80
          const velocity = {
            x: (Math.random() - 0.5) * speed * 2,
            y: (Math.random() - 0.5) * speed * 2,
            z: (Math.random() - 0.5) * speed * 2,
          }
          devLog('💥 Scattering orb:', id, velocity)
          body.wakeUp()
          body.setLinvel(velocity, true)
        }
      } catch (e) {
        // Body is invalid, skip it
      }
    })
    
    router.push(`/album/${slug}`)
  }, [router, albums])
  
  // Handle hover - find album and set both title and album object
  const handleHover = useCallback((title: string | null) => {
    setHoveredTitle(title)
    if (title) {
      const album = albums.find(a => a.title === title)
      setHoveredAlbum(album || null)
    } else {
      setHoveredAlbum(null)
    }
  }, [albums])

  useEffect(() => {
    if (hoveredAlbum && isPointerDownRef.current) {
      setIsHolding(false)
    }
  }, [hoveredAlbum])
  
  const handleDepthPush = useCallback(() => {
    devLog('🎯 Depth push triggered!')
    setPushTrigger(prev => prev + 1)
  }, [])

  const handleRegisterRigidBody = useCallback((id: string, body: RapierRigidBody, initialPos: [number, number, number]) => {
    rigidBodies.current.set(id, { body, initialPos })
  }, [])

  const handleReset = useCallback(() => {
    devLog('🔄 Resetting all orbs to initial positions')
    
    rigidBodies.current.forEach(({ body, initialPos }) => {
      // Reset position
      body.setTranslation({ x: initialPos[0], y: initialPos[1], z: initialPos[2] }, true)
      
      // Stop all movement
      body.setLinvel({ x: 0, y: 0, z: 0 }, true)
      body.setAngvel({ x: 0, y: 0, z: 0 }, true)
      
      // Wake up body
      body.wakeUp()
    })
    
    setResetTrigger(prev => prev + 1)
  }, [])

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    isPointerDownRef.current = true
    if (!isMobile && !hoveredAlbum) {
      setIsHolding(true)
    }
  }, [hoveredAlbum, isMobile])

  const handlePointerUp = useCallback(() => {
    isPointerDownRef.current = false
    setIsHolding(false)
  }, [])

  const handlePointerLeave = useCallback(() => {
    isPointerDownRef.current = false
    setIsHolding(false)
  }, [])

  useEffect(() => {
    if (isMobile) {
      if (autoClickIntervalRef.current) {
        clearInterval(autoClickIntervalRef.current)
        autoClickIntervalRef.current = null
      }
      return
    }

    if (isHolding) {
      if (autoClickIntervalRef.current) {
        return
      }
      autoClickIntervalRef.current = setInterval(() => {
        handleDepthPush()
      }, 180)
    } else if (autoClickIntervalRef.current) {
      clearInterval(autoClickIntervalRef.current)
      autoClickIntervalRef.current = null
    }

    return () => {
      if (autoClickIntervalRef.current) {
        clearInterval(autoClickIntervalRef.current)
        autoClickIntervalRef.current = null
      }
    }
  }, [isHolding, handleDepthPush, isMobile])
  
  return (
    <>
      {/* 3D Canvas - Fullscreen */}
      <Canvas
        key={canvasKey}
        onPointerMissed={isMobile ? undefined : handleDepthPush}
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
            devWarn('WebGL context lost (OrbField).')
          }

          const onRestored = () => {
            devLog('WebGL context restored (OrbField).')
            setCanvasKey((k) => k + 1)
          }

          canvas.addEventListener('webglcontextlost', onLost)
          canvas.addEventListener('webglcontextrestored', onRestored)
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          touchAction: 'pan-y'  // Allow vertical scroll, capture horizontal/drag for orb physics
        }}
      >
        <PerformanceMonitor
          onDecline={() => {
            setDpr(prev => Math.max(1, prev * 0.9))
            // On mobile, respect the user's explicit 3D choice and keep glass bubbles.
            if (!isMobile && dpr < 1.2) {
              setUseGlassBubbles(false)
            }
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
          pushTrigger={pushTrigger}
          onHover={handleHover}
          onNavigate={handleNavigate}
          deviceTier={deviceTier}
          useGlassBubbles={useGlassBubbles}
          onRegisterRigidBody={handleRegisterRigidBody}
          onReset={resetTrigger}
          hoveredAlbum={hoveredAlbum}
          isMobile={isMobile}
          allBodiesRef={rigidBodies}
        />
        
        {/* Post-processing effects - reduced on mobile to prevent pixelation/jitter */}
        {!isMobile ? (
          <EffectComposer multisampling={quality.multisampling}>
            <Bloom
              intensity={quality.bloomIntensity}
              luminanceThreshold={0.97}
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
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        )}
      </Canvas>

      {/* Fallback for no albums */}
      {albums.length === 0 && (
        <div className="fixed inset-0 flex items-center justify-center z-10">
          <p className="text-bone/50 text-lg">No albums available</p>
        </div>
      )}

      {/* RESET BUTTON - Only on desktop (overlaps orbs on mobile) */}
      {!isMobile && (
        <button
          onClick={handleReset}
          style={{
            position: 'fixed',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            padding: '12px 24px',
            background: 'transparent',
            color: '#00ffff',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            backdropFilter: 'blur(5px)',
            boxShadow: '0 0 10px rgba(0, 255, 255, 0.2)',
            transition: 'all 0.3s ease',
            opacity: 0.7
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.6)'
            e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.4)'
            e.currentTarget.style.opacity = '1'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.3)'
            e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.2)'
            e.currentTarget.style.opacity = '0.7'
          }}
        >
          RESET
        </button>
      )}
    </>
  )
}

// Static fallback for reduced motion or no WebGL
export function OrbFieldFallback({ albums }: OrbFieldProps) {
  const router = useRouter()

  devLog('OrbFieldFallback rendering with albums:', albums.length)

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
