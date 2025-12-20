'use client'

/**
 * Mobile hamburger menu - consolidates all mobile controls into a single slide-out menu.
 * Replaces scattered top-right buttons on mobile.
 */

import { useState, useEffect } from 'react'
import { Menu, X, Grid3x3, Circle, Palette, HelpCircle, LogIn, LogOut, User, Star } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { signInWithGoogle, signOut } from '@/lib/auth'
import { MyRatingsModal } from './MyRatingsModal'

type MonochromeMode = 'normal' | 'cyan' | 'pastel' | 'green'

interface MobileMenuProps {
  is3D: boolean
  onToggle3D: () => void
  onOpenTutorial: () => void
}

export function MobileMenu({ 
  is3D, 
  onToggle3D, 
  onOpenTutorial,
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showStyleSubmenu, setShowStyleSubmenu] = useState(false)
  const [showRatings, setShowRatings] = useState(false)
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  
  const [styleMode, setStyleMode] = useState<MonochromeMode>(() => {
    if (typeof window === 'undefined') return 'normal'
    const stored = localStorage.getItem('monochrome-mode') as MonochromeMode | null
    return stored || 'normal'
  })

  // Apply style mode to document
  useEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    root.classList.remove('monochrome-cyan', 'monochrome-pastel', 'monochrome-green')

    if (styleMode !== 'normal') {
      root.classList.add(`monochrome-${styleMode}`)
    }

    try {
      localStorage.setItem('monochrome-mode', styleMode)
    } catch {
      // ignore storage errors
    }
  }, [styleMode])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const getStyleLabel = (mode: MonochromeMode) => {
    switch (mode) {
      case 'normal': return 'Color'
      case 'cyan': return 'Cyan'
      case 'pastel': return 'Pastel'
      case 'green': return 'Terminal'
    }
  }

  const styles: MonochromeMode[] = ['normal', 'cyan', 'pastel', 'green']

  return (
    <>
      {/* Hamburger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-[100] flex h-12 w-12 items-center justify-center rounded-lg bg-void/90 backdrop-blur-sm border border-voltage/30 transition-colors active:bg-voltage/20"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-bone" />
      </button>

      {/* Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[200]">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)} 
          />

          {/* Menu Panel - slides in from right */}
          <div className="absolute top-0 right-0 w-72 h-full bg-void border-l border-voltage/20 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-bone/10">
              <h2 className="text-lg font-bold text-bone">Menu</h2>
              <button 
                type="button"
                onClick={() => setIsOpen(false)} 
                className="p-2 rounded-lg hover:bg-bone/10 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-bone" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-2">
              {/* View Toggle */}
              <button
                type="button"
                onClick={() => {
                  onToggle3D()
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-bone/5 hover:bg-bone/10 text-bone transition-colors"
              >
                {is3D ? <Grid3x3 className="w-5 h-5 text-voltage" /> : <Circle className="w-5 h-5 text-voltage" />}
                <span>{is3D ? 'Switch to Grid View' : 'Switch to Orb View'}</span>
              </button>

              {/* Style Submenu */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowStyleSubmenu(!showStyleSubmenu)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-bone/5 hover:bg-bone/10 text-bone transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-voltage" />
                    <span>Style: {getStyleLabel(styleMode)}</span>
                  </div>
                  <span className={`text-bone/50 transition-transform ${showStyleSubmenu ? 'rotate-180' : ''}`}>▼</span>
                </button>
                
                {showStyleSubmenu && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-bone/10 pl-4">
                    {styles.map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => {
                          setStyleMode(style)
                          setShowStyleSubmenu(false)
                        }}
                        className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                          styleMode === style 
                            ? 'bg-voltage/20 text-voltage' 
                            : 'text-bone/70 hover:text-bone hover:bg-bone/5'
                        }`}
                      >
                        {getStyleLabel(style)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tutorial */}
              <button
                type="button"
                onClick={() => {
                  onOpenTutorial()
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-bone/5 hover:bg-bone/10 text-bone transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-voltage" />
                <span>Tutorial</span>
              </button>

              {/* Divider */}
              <hr className="border-bone/10 my-4" />

              {/* Auth Section */}
              {authLoading ? (
                <div className="px-4 py-3 text-bone/50 text-sm">Loading...</div>
              ) : isAuthenticated ? (
                <div className="space-y-2">
                  {/* User Info */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    {user?.user_metadata?.avatar_url ? (
                      <img 
                        src={user.user_metadata.avatar_url} 
                        alt="" 
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-voltage/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-voltage" />
                      </div>
                    )}
                    <span className="text-bone truncate flex-1">
                      {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                    </span>
                  </div>

                  {/* My Ratings */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowRatings(true)
                      setIsOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-bone/5 hover:bg-bone/10 text-bone transition-colors"
                  >
                    <Star className="w-5 h-5 text-voltage" />
                    <span>My Ratings</span>
                  </button>

                  {/* Sign Out */}
                  <button
                    type="button"
                    onClick={() => {
                      signOut()
                      setIsOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
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
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-voltage/10 hover:bg-voltage/20 text-voltage transition-colors"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Sign In with Google</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* My Ratings Modal */}
      <MyRatingsModal
        isOpen={showRatings}
        onClose={() => setShowRatings(false)}
      />
    </>
  )
}
