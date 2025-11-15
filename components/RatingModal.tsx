'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { RatingStars } from '@/components/RatingStars'
import { useAudioStore } from '@/lib/audio-store'

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RatingModal({ isOpen, onClose }: RatingModalProps) {
  const { currentVersion } = useAudioStore()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setRating(0)
      setComment('')
      setError(null)
      setSuccess(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  if (!currentVersion) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-xl bg-void border border-bone/20 p-6 text-bone">
          <p className="text-sm mb-4">No song is currently playing.</p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-bone/10 hover:bg-bone/20 text-sm"
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

    if (rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5 stars.')
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
      // Give the user a brief moment to see success, then close
      setTimeout(() => {
        onClose()
      }, 800)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong while saving your rating.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-void border border-bone/20 p-6 text-bone shadow-xl">
        <h2 className="text-lg font-semibold mb-2">Rate this version</h2>
        <p className="text-sm text-bone/70 mb-4 truncate">{currentVersion.label}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-xs text-bone/60 mb-1">Your rating</p>
            <RatingStars
              value={rating}
              onChange={setRating}
              readOnly={isSubmitting}
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
              className="px-3 py-1.5 text-xs rounded-md border border-bone/30 text-bone/80 hover:bg-bone/10 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs rounded-md bg-voltage text-void font-medium hover:brightness-110 disabled:opacity-60"
            >
              {isSubmitting ? 'Saving…' : 'Submit rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
