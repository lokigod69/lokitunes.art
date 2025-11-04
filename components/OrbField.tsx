'use client'

import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { useRouter } from 'next/navigation'
import { SonicOrb } from './SonicOrb'
import type { Album } from '@/lib/supabase'

interface OrbFieldProps {
  albums: Album[]
}

function OrbScene({ albums, onHover, onNavigate }: {
  albums: Album[]
  onHover: (title: string | null) => void
  onNavigate: (slug: string) => void
}) {
  return (
    <Physics gravity={[0, 0, 0]}>
      {albums.map((album, index) => (
        <SonicOrb
          key={album.id}
          album={album}
          index={index}
          onHover={onHover}
          onNavigate={onNavigate}
        />
      ))}
    </Physics>
  )
}

export function OrbField({ albums }: OrbFieldProps) {
  const router = useRouter()
  const [hoveredTitle, setHoveredTitle] = useState<string | null>(null)

  const handleNavigate = (slug: string) => {
    router.push(`/album/${slug}`)
  }

  return (
    <div className="relative w-full" style={{ minHeight: '70vh' }}>
      {/* 3D Canvas */}
      <Canvas
        camera={{ 
          position: [0, 0, 12],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />
        <Environment preset="night" environmentIntensity={0.4} />
        <Suspense fallback={null}>
          <OrbScene
            albums={albums}
            onHover={setHoveredTitle}
            onNavigate={handleNavigate}
          />
        </Suspense>
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
