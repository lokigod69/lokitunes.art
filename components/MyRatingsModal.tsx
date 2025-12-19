/**
 * Modal displaying user's rating history with album navigation
 */
'use client'

import { useState, useEffect } from 'react'
import { X, Star, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface UserRating {
  id: string
  version_id: string
  rating: number
  comment: string | null
  updated_at: string
  version_label: string
  song_title: string
  album_title: string
  album_slug: string
  cover_url: string | null
}

interface MyRatingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function MyRatingsModal({ isOpen, onClose }: MyRatingsModalProps) {
  const [ratings, setRatings] = useState<UserRating[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      fetchRatings()
    }
  }, [isOpen])

  async function fetchRatings() {
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/user/ratings')
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch ratings')
      }
      
      setRatings(data.ratings || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ratings')
    } finally {
      setLoading(false)
    }
  }

  function handleNavigate(albumSlug: string) {
    onClose()
    router.push(`/album/${albumSlug}`)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[80vh] bg-void border border-bone/20 rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-bone/10">
          <h2 className="text-lg font-semibold text-bone flex items-center gap-2">
            <Star className="w-5 h-5 text-voltage" />
            My Ratings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-bone" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-bone/50">Loading ratings...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-400">{error}</div>
            </div>
          ) : ratings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Star className="w-12 h-12 text-bone/20 mb-4" />
              <p className="text-bone/50">No ratings yet</p>
              <p className="text-bone/30 text-sm mt-1">
                Rate some versions to see them here!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {ratings.map((rating) => (
                <button
                  key={rating.id}
                  onClick={() => handleNavigate(rating.album_slug)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left group"
                >
                  {/* Cover */}
                  <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-void">
                    {rating.cover_url ? (
                      <Image
                        src={rating.cover_url}
                        alt={rating.song_title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-bone/10" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-bone truncate">
                      {rating.song_title}
                    </p>
                    <p className="text-xs text-bone/50 truncate">
                      {rating.version_label} • {rating.album_title}
                    </p>
                    {rating.comment && (
                      <p className="text-xs text-bone/40 truncate mt-1">
                        "{rating.comment}"
                      </p>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-lg font-bold text-voltage">
                      {rating.rating}
                    </span>
                    <Star className="w-4 h-4 text-voltage fill-voltage" />
                  </div>

                  {/* Navigate icon */}
                  <ExternalLink className="w-4 h-4 text-bone/30 group-hover:text-bone/60 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {ratings.length > 0 && (
          <div className="p-4 border-t border-bone/10 text-center">
            <p className="text-xs text-bone/40">
              {ratings.length} rating{ratings.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
