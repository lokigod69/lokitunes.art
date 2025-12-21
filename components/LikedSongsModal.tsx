'use client'

import { useMemo } from 'react'
import { X, Heart, Play } from 'lucide-react'
import Image from 'next/image'
import { useLikes } from '@/hooks/useLikes'
import { useAudioStore } from '@/lib/audio-store'

interface LikedSongsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LikedSongsModal({ isOpen, onClose }: LikedSongsModalProps) {
  const { likes, loading, toggleLike } = useLikes()
  const { play, currentVersion, isPlaying, currentPalette } = useAudioStore()

  const fallbackPalette = useMemo(() => currentPalette ?? null, [currentPalette])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[80vh] bg-void border border-bone/20 rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-bone/10">
          <h2 className="text-lg font-semibold text-bone flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            Liked Songs
            <span className="text-bone/50 text-sm font-normal">({likes.length})</span>
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-bone" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-bone/50">Loading liked songs...</div>
            </div>
          ) : likes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Heart className="w-12 h-12 text-bone/20 mb-4" />
              <p className="text-bone/50">No liked songs yet</p>
              <p className="text-bone/30 text-sm mt-1">Tap the heart icon on any track to add it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {likes.map((like) => {
                const isCurrentTrack = currentVersion?.id === like.version_id
                const isCurrentlyPlaying = isCurrentTrack && isPlaying
                const coverUrl = like.version_cover || like.album_cover

                const handlePlay = () => {
                  play(
                    {
                      id: like.version_id,
                      song_id: like.song_id,
                      label: like.version_label,
                      audio_url: like.audio_url,
                      cover_url: coverUrl,
                      duration_sec: like.duration_sec,
                      waveform_json: null,
                      play_count: 0,
                      created_at: like.liked_at,
                      songId: like.song_id,
                      songTitle: like.song_title,
                      albumTitle: like.album_title,
                      albumSlug: like.album_slug,
                      albumPalette: like.album_palette,
                    },
                    like.song_id,
                    like.album_palette ?? fallbackPalette
                  )
                }

                return (
                  <div
                    key={like.like_id}
                    onClick={handlePlay}
                    className={
                      'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left cursor-pointer ' +
                      (isCurrentTrack ? 'bg-white/10 border border-bone/20' : 'bg-white/5 hover:bg-white/10')
                    }
                  >
                    <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-void">
                      {coverUrl ? (
                        <Image src={coverUrl} alt={like.song_title} fill sizes="48px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-bone/10" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-bone truncate">{like.song_title}</p>
                      <p className="text-xs text-bone/50 truncate">
                        {like.version_label} • {like.album_title}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePlay()
                        }}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        aria-label="Play"
                        title="Play"
                      >
                        <Play className={"w-5 h-5 " + (isCurrentlyPlaying ? 'text-voltage' : 'text-bone')} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleLike(like.version_id)
                        }}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        aria-label="Unlike"
                        title="Unlike"
                      >
                        <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
