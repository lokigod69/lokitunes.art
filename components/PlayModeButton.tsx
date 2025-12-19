/**
 * Play Mode Button
 * UI control for starting/pausing/stopping the Orb Defense mini-game
 */
'use client'

import { Play, Pause, Square } from 'lucide-react'
import { usePlayMode } from '@/hooks/usePlayMode'

export function PlayModeButton() {
  const { 
    isActive, 
    isPaused, 
    orbsRemaining, 
    totalOrbs, 
    startGame, 
    pauseGame, 
    resumeGame, 
    stopGame 
  } = usePlayMode()

  if (!isActive) {
    return (
      <button
        onClick={startGame}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 hover:bg-black/80 border border-cyan-500/30 hover:border-cyan-500 backdrop-blur transition-all"
        title="Start Orb Defense"
      >
        <Play className="w-4 h-4 text-cyan-400" />
        <span className="text-sm text-cyan-400 font-mono uppercase tracking-wider">Play</span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/60 border border-cyan-500/30 backdrop-blur">
      {/* Orb counter */}
      <span className="text-sm font-mono text-cyan-400">
        {orbsRemaining}/{totalOrbs}
      </span>
      
      {/* Pause/Resume */}
      <button
        onClick={isPaused ? resumeGame : pauseGame}
        className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
        title={isPaused ? 'Resume' : 'Pause'}
      >
        {isPaused ? (
          <Play className="w-4 h-4 text-green-400" />
        ) : (
          <Pause className="w-4 h-4 text-yellow-400" />
        )}
      </button>
      
      {/* Stop */}
      <button
        onClick={stopGame}
        className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
        title="Stop game"
      >
        <Square className="w-4 h-4 text-red-400" />
      </button>
    </div>
  )
}
