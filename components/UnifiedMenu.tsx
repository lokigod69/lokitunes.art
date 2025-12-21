'use client'

/**
 * Unified hamburger menu used on the home page for both desktop and mobile.
 */

import { useEffect, useState } from 'react'
import {
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  Palette,
  Play,
  Pause,
  Square,
  HelpCircle,
  Grid3x3,
  Circle,
  Heart,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { signInWithGoogle, signOut } from '@/lib/auth'
import { usePlayMode } from '@/hooks/usePlayMode'
import { LikedSongsModal } from '@/components/LikedSongsModal'
import { useLikes } from '@/hooks/useLikes'
import type { LokiTunesStyle } from '@/hooks/useStyle'

interface UnifiedMenuProps {
  isMobile: boolean
  is3D: boolean
  onToggle3D: () => void
  showViewToggle?: boolean

  currentStyle: LokiTunesStyle
  onStyleChange: (style: LokiTunesStyle) => void

  onOpenTutorial: () => void

  showPlayMode?: boolean
  repelStrength?: number
  onRepelChange?: (value: number) => void
}

export function UnifiedMenu({
  isMobile,
  is3D,
  onToggle3D,
  showViewToggle = true,
  currentStyle,
  onStyleChange,
  onOpenTutorial,
  showPlayMode = false,
  repelStrength = 0,
  onRepelChange,
}: UnifiedMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showLikedSongs, setShowLikedSongs] = useState(false)

  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { likes } = useLikes()
  const {
    isActive: playModeActive,
    isPaused,
    startGame,
    pauseGame,
    resumeGame,
    stopGame,
    orbsRemaining,
    totalOrbs,
  } = usePlayMode()

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-[9999] flex h-12 w-12 items-center justify-center rounded-lg bg-void/90 backdrop-blur-sm border border-voltage/30 transition-colors hover:bg-void/95 active:bg-voltage/20 cursor-pointer"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-bone" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[200]">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute top-0 right-0 w-80 max-w-[90vw] h-full bg-void/95 backdrop-blur-md border-l border-voltage/20 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-4 border-b border-bone/10">
              <h2 className="text-lg font-bold text-bone">Settings</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-bone/10 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-bone" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <div className="px-2 text-xs uppercase tracking-wide text-bone/50 font-semibold">Account</div>
              <div className="pb-4 border-b border-bone/10">
                {authLoading ? (
                  <div className="px-4 py-3 text-bone/50 text-sm">Loading...</div>
                ) : isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-3 py-2">
                      {user?.user_metadata?.avatar_url ? (
                        <img
                          src={user.user_metadata.avatar_url}
                          alt=""
                          className="w-10 h-10 rounded-full border border-voltage/30"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-voltage/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-voltage" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-bone font-medium truncate">
                          {user?.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-bone/60 text-sm truncate">{user?.email}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        signOut()
                        setIsOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      signInWithGoogle()
                      setIsOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-voltage/10 hover:bg-voltage/20 border border-voltage/30 rounded-lg text-voltage transition-colors cursor-pointer"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>Sign In with Google</span>
                  </button>
                )}
              </div>

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    setShowLikedSongs(true)
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bone/5 rounded-lg transition-colors cursor-pointer"
                >
                  <Heart className="w-5 h-5 text-red-500" />
                  <span className="text-bone">Liked Songs</span>
                  {likes.length > 0 && (
                    <span className="ml-auto text-xs text-bone/60">{likes.length}</span>
                  )}
                </button>
              )}

              {!isMobile && showPlayMode && (
                <>
                  <div className="pt-2 px-2 text-xs uppercase tracking-wide text-bone/50 font-semibold">Experience</div>
                <div className="py-2">
                  <div className="px-4 py-3 rounded-lg bg-bone/5 border border-bone/10">
                    <div className="flex items-center gap-3">
                      <Play className="w-5 h-5 text-voltage" />
                      <span className="text-bone font-medium">Play Mode</span>
                      {playModeActive && (
                        <span className="text-xs bg-voltage/20 text-voltage px-2 py-0.5 rounded">
                          {orbsRemaining}/{totalOrbs}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      {!playModeActive ? (
                        <button
                          type="button"
                          onClick={() => {
                            startGame()
                            setIsOpen(false)
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-voltage/20 hover:bg-voltage/30 rounded-lg text-voltage cursor-pointer"
                        >
                          <Play className="w-4 h-4" />
                          <span>Start</span>
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={isPaused ? resumeGame : pauseGame}
                            className="p-2 bg-bone/10 hover:bg-bone/20 rounded-lg cursor-pointer"
                            aria-label={isPaused ? 'Resume play mode' : 'Pause play mode'}
                            title={isPaused ? 'Resume' : 'Pause'}
                          >
                            {isPaused ? (
                              <Play className="w-4 h-4 text-voltage" />
                            ) : (
                              <Pause className="w-4 h-4 text-yellow-400" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              stopGame()
                            }}
                            className="p-2 bg-bone/10 hover:bg-bone/20 rounded-lg cursor-pointer"
                            aria-label="Stop play mode"
                            title="Stop"
                          >
                            <Square className="w-4 h-4 text-red-400" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                </>
              )}

              {!isMobile && (
                <>
                  <div className="pt-2 px-2 text-xs uppercase tracking-wide text-bone/50 font-semibold">Experience</div>
                <div className="py-2">
                  <div className="px-4 py-3 rounded-lg bg-bone/5 border border-bone/10">
                    <div className="flex items-center gap-3">
                      <span className="text-bone font-medium">Repel</span>
                      <span className="text-xs text-bone/60">{repelStrength}</span>
                    </div>
                    <div className="mt-2 space-y-2">
                      <label className="text-sm text-bone/60">Repel Strength</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={repelStrength}
                        onChange={(e) => onRepelChange?.(Number(e.target.value))}
                        className="w-full h-2 bg-bone/10 rounded-lg appearance-none cursor-pointer accent-[var(--voltage)]"
                      />
                    </div>
                  </div>
                </div>
                </>
              )}

              <div className="pt-2 px-2 text-xs uppercase tracking-wide text-bone/50 font-semibold">Display</div>
              <div className="py-2">
                <div className="px-4 py-3 rounded-lg bg-bone/5 border border-bone/10">
                  <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-voltage" />
                    <span className="text-bone font-medium">Style</span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    {([
                      { key: 'color', label: 'Color', dot: 'bg-voltage' },
                      { key: 'chrome', label: 'Chrome', dot: 'bg-bone/70' },
                      { key: 'monochrome', label: 'Mono', dot: 'bg-emerald-400' },
                      { key: 'invert', label: 'Invert', dot: 'bg-fuchsia-400' },
                    ] as const).map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => onStyleChange(s.key)}
                        className={
                          'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer ' +
                          (currentStyle === s.key
                            ? 'border-voltage bg-voltage/10 text-voltage'
                            : 'border-bone/20 bg-transparent text-bone/70 hover:text-bone hover:bg-bone/5')
                        }
                        aria-pressed={currentStyle === s.key}
                      >
                        <span className={'w-2.5 h-2.5 rounded-full ' + s.dot} />
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {isMobile && showViewToggle && (
                <button
                  type="button"
                  onClick={() => {
                    onToggle3D()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bone/5 rounded-lg transition-colors cursor-pointer"
                >
                  {is3D ? (
                    <Circle className="w-5 h-5 text-voltage" />
                  ) : (
                    <Grid3x3 className="w-5 h-5 text-voltage" />
                  )}
                  <span className="text-bone">
                    {is3D ? 'Switch to Grid View' : 'Switch to Orb View'}
                  </span>
                </button>
              )}

              <div className="pt-2 px-2 text-xs uppercase tracking-wide text-bone/50 font-semibold">Help</div>
              <button
                type="button"
                onClick={() => {
                  onOpenTutorial()
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bone/5 rounded-lg transition-colors cursor-pointer"
              >
                <HelpCircle className="w-5 h-5 text-voltage" />
                <span className="text-bone">Tutorial</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <LikedSongsModal
        isOpen={showLikedSongs}
        onClose={() => setShowLikedSongs(false)}
      />
    </>
  )
}
