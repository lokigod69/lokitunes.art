'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { X, Star } from 'lucide-react'
import { RatingStars } from '@/components/RatingStars'
import { useAudioStore } from '@/lib/audio-store'

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RatingModal({ isOpen, onClose }: RatingModalProps) {
  const { currentVersion, currentPalette } = useAudioStore()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [stats, setStats] = useState<any>(null)
  const [userRating, setUserRating] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const accentColor = currentPalette?.accent1 || '#4F9EFF'

  useEffect(() => {
    if (!isOpen || !currentVersion) return

    let isCancelled = false
    const load = async () => {
      setIsLoading(true)
      setIsEditing(false)
      setError(null)
      setSuccess(false)

      try {
        const res = await fetch(`/api/ratings/${currentVersion.id}`)
        if (!res.ok) throw new Error('Failed to load ratings')
        const data = await res.json()

        if (isCancelled) return

        setStats(data.stats || null)
        setUserRating(data.userRating || null)
        setComments(data.comments || [])

        if (data.userRating) {
          setRating(data.userRating.rating || 0)
          setComment(data.userRating.comment || '')
        } else {
          setRating(0)
          setComment('')
        }
      } catch (err) {
        console.error('Failed to fetch ratings:', err)
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      isCancelled = true
    }
  }, [isOpen, currentVersion])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
    }

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  if (!currentVersion) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
        <div
          className="w-full max-w-md rounded-xl bg-void border border-bone/20 p-6 text-bone"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm mb-4">No song is currently playing.</p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-bone/10 hover:bg-bone/20 text-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return

    if (rating < 1 || rating > 10) {
      setError('Please select a rating between 1 and 10.')
      return
    }

    const trimmedComment = comment.trim()
    if (trimmedComment.length > 200) {
      setError('Comment must be 200 characters or fewer.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          versionId: currentVersion.id,
          songId: currentVersion.song_id,
          ratingStars: rating,
          comment: trimmedComment || undefined,
        }),
      })

      if (!response.ok) {
        let message = 'Failed to save rating.'
        try {
          const data = await response.json()
          if (data?.error) message = data.error
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(message)
      }

      setSuccess(true)

      if (currentVersion) {
        try {
          const refresh = await fetch(`/api/ratings/${currentVersion.id}`)
          if (refresh.ok) {
            const data = await refresh.json()
            setStats(data.stats || null)
            setUserRating(data.userRating || null)
            setComments(data.comments || [])
            setIsEditing(false)
          }
        } catch (err) {
          console.error('Failed to refresh ratings after submit:', err)
        }
      }

      setTimeout(() => {
        setSuccess(false)
      }, 1500)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong while saving your rating.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-void border border-bone/20 p-6 text-bone shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-semibold">Rate this version</h2>
            <p className="text-sm text-bone/70 mt-1 truncate">{currentVersion.label}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-bone/60 hover:text-bone cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-bone/60 text-sm">Loading ratings…</p>
          </div>
        ) : userRating && !isEditing ? (
          <div className="space-y-6">
            <div className="p-4 bg-bone/5 rounded border border-bone/10">
              <p className="text-xs text-bone/60 mb-2">Your rating</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold" style={{ color: accentColor }}>
                  {userRating.rating}/10
                </span>
                <Star size={20} fill={accentColor} color={accentColor} />
              </div>
              {userRating.comment && (
                <p className="text-sm text-bone/80 mt-2 italic">"{userRating.comment}"</p>
              )}
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs text-cyan-400 hover:text-cyan-300 mt-2 underline cursor-pointer"
              >
                Edit your rating
              </button>
            </div>

            {stats && stats.rating_count > 0 && (
              <div>
                <p className="text-xs text-bone/60 mb-2">Community rating</p>
                <div className="flex items-center gap-2">
                  <Star size={20} fill={accentColor} color={accentColor} />
                  <span className="text-lg font-medium text-bone">
                    {stats.avg_rating.toFixed(1)}/10
                  </span>
                  <span className="text-sm text-bone/60">
                    ({stats.rating_count} {stats.rating_count === 1 ? 'rating' : 'ratings'})
                  </span>
                </div>
              </div>
            )}

            {comments.length > 0 && (
              <div>
                <p className="text-xs text-bone/60 mb-2">Recent comments</p>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 bg-bone/5 rounded border-l-2 border-bone/20"
                    >
                      <p className="text-sm text-bone/90 mb-1">"{c.comment}"</p>
                      <div className="flex items-center gap-2 text-xs text-bone/50">
                        <span>{new Date(c.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{c.rating}/10</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  if (userRating) {
                    setRating(userRating.rating)
                    setComment(userRating.comment || '')
                  }
                }}
                className="w-full mb-3 text-sm text-bone/60 hover:text-bone cursor-pointer text-left"
              >
                ← Cancel editing
              </button>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-xs text-bone/60 mb-1">Your rating (1–10)</p>
                <RatingStars
                  value={rating}
                  onChange={setRating}
                  readOnly={isSubmitting}
                  size={20}
                  color={accentColor}
                />
              </div>

              <div>
                <label className="block text-xs text-bone/60 mb-1" htmlFor="rating-comment">
                  Optional comment (max 200 chars)
                </label>
                <textarea
                  id="rating-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={200}
                  rows={3}
                  className="w-full rounded-md bg-black/40 border border-bone/20 px-3 py-2 text-sm text-bone placeholder:text-bone/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-voltage/80"
                  placeholder="What did you think of this version?"
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-[11px] text-bone/40 text-right">
                  {comment.length}/200
                </p>
              </div>

              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}

              {success && (
                <p className="text-xs text-emerald-400">Thanks for rating!</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-xs rounded-md border border-bone/30 text-bone/80 hover:bg-bone/10 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || rating === 0}
                  className="px-3 py-1.5 text-xs rounded-md bg-voltage text-void font-medium hover:brightness-110 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving…' : isEditing ? 'Update rating' : 'Submit rating'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
