'use client'

import { RatingStars } from '@/components/RatingStars'

interface RatingComment {
  id: string
  rating: number
  comment: string | null
  created_at: string
}

interface RatingCommentsListProps {
  comments: RatingComment[]
  accentColor?: string
}

export function RatingCommentsList({ comments, accentColor }: RatingCommentsListProps) {
  if (!comments || comments.length === 0) {
    return <p className="text-bone/60 text-sm text-center py-4">No comments yet</p>
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {comments.map((c) => (
        <div key={c.id} className="border-b border-bone/10 pb-3 last:border-0">
          <div className="flex items-center gap-2 mb-1">
            <RatingStars value={c.rating} readOnly size={14} color={accentColor} />
            <span className="text-xs text-bone/60">
              {new Date(c.created_at).toLocaleDateString()}
            </span>
          </div>
          {c.comment && (
            <p className="text-sm text-bone/80">{c.comment}</p>
          )}
        </div>
      ))}
    </div>
  )
}
