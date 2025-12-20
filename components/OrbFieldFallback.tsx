'use client'

/**
 * Lightweight 2D fallback for the home OrbField.
 */

import { useRouter } from 'next/navigation'
import type { Album } from '@/lib/supabase'
import { devLog } from '@/lib/debug'

interface OrbFieldFallbackProps {
  albums: Album[]
}

export function OrbFieldFallback({ albums }: OrbFieldFallbackProps) {
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
            <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-void/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
            <p className="text-bone text-sm font-medium text-center">{album.title}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
