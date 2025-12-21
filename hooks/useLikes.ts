/**
 * Shared likes hook/state for liked song versions.
 */

import { useCallback, useEffect, useMemo } from 'react'
import { create } from 'zustand'
import { useAuth } from '@/hooks/useAuth'
import type { Album } from '@/lib/supabase'

export interface LikedVersion {
  like_id: string
  version_id: string
  liked_at: string
  version_label: string
  audio_url: string
  version_cover: string | null
  duration_sec: number | null
  song_title: string
  song_id: string
  album_title: string
  album_slug: string
  album_cover: string | null
  album_palette: Album['palette'] | null
}

type LikesState = {
  accessToken: string | null
  likes: LikedVersion[]
  loading: boolean
  setAccessToken: (token: string | null) => void
  setLikes: (likes: LikedVersion[]) => void
  setLoading: (loading: boolean) => void
}

const useLikesStore = create<LikesState>((set) => ({
  accessToken: null,
  likes: [],
  loading: false,
  setAccessToken: (token) => set({ accessToken: token }),
  setLikes: (likes) => set({ likes }),
  setLoading: (loading) => set({ loading }),
}))

export function useLikes() {
  const { isAuthenticated, session } = useAuth()
  const accessToken = session?.access_token || null

  const likes = useLikesStore((s) => s.likes)
  const loading = useLikesStore((s) => s.loading)
  const setAccessToken = useLikesStore((s) => s.setAccessToken)
  const setLikes = useLikesStore((s) => s.setLikes)
  const setLoading = useLikesStore((s) => s.setLoading)

  useEffect(() => {
    setAccessToken(isAuthenticated ? accessToken : null)
    if (!isAuthenticated) {
      setLikes([])
    }
  }, [isAuthenticated, accessToken, setAccessToken, setLikes])

  const likedIds = useMemo(() => new Set(likes.map((l) => l.version_id)), [likes])

  const fetchLikes = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setLikes([])
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/likes', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to fetch likes')
      }

      setLikes(Array.isArray(data.likes) ? data.likes : [])
    } catch (error) {
      console.error('Failed to fetch likes:', error)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, accessToken, setLikes, setLoading])

  useEffect(() => {
    fetchLikes()
  }, [fetchLikes])

  const isLiked = useCallback((versionId: string) => likedIds.has(versionId), [likedIds])

  const toggleLike = useCallback(
    async (versionId: string) => {
      if (!isAuthenticated || !accessToken) return false

      const currentlyLiked = likedIds.has(versionId)

      try {
        if (currentlyLiked) {
          const res = await fetch('/api/likes', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ versionId }),
          })

          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            throw new Error(data?.error || 'Failed to unlike')
          }

          setLikes(likes.filter((l) => l.version_id !== versionId))
          return true
        }

        const res = await fetch('/api/likes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ versionId }),
        })

        if (res.status === 409) {
          return true
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data?.error || 'Failed to like')
        }

        await fetchLikes()
        return true
      } catch (error) {
        console.error('Failed to toggle like:', error)
        return false
      }
    },
    [isAuthenticated, accessToken, likedIds, likes, setLikes, fetchLikes]
  )

  return {
    likes,
    likedIds,
    loading,
    isLiked,
    toggleLike,
    refetch: fetchLikes,
  }
}
