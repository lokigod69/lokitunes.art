'use client'

import { useAudioStore } from '@/lib/audio-store'
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function GlobalAudioPlayer() {
  const { 
    currentVersion, 
    isPlaying, 
    currentTime,
    duration,
    volume,
    play, 
    pause, 
    next, 
    previous,
    setCurrentTime,
    setDuration,
    setVolume,
    updateTime,
  } = useAudioStore()
  
  const audioRef = useRef<HTMLAudioElement>(null)
  
  // Update audio source when track changes
  useEffect(() => {
    if (!audioRef.current || !currentVersion) return
    
    audioRef.current.src = currentVersion.audio_url
    audioRef.current.load()
    
    if (isPlaying) {
      audioRef.current.play().catch(console.error)
    }
  }, [currentVersion?.id])
  
  // Control playback
  useEffect(() => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.play().catch(console.error)
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying])
  
  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    
    const handleTimeUpdate = () => updateTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => next()
    
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [next, setDuration, updateTime])
  
  // Apply volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])
  
  if (!currentVersion) return null
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-void/95 backdrop-blur-lg border-t border-voltage/30 z-50">
      <audio ref={audioRef} />
      
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
        {/* Main Controls Row */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {currentVersion.cover_url && (
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded overflow-hidden flex-shrink-0 bg-void">
                <Image
                  src={currentVersion.cover_url}
                  alt={currentVersion.label}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-bone truncate">{currentVersion.label}</p>
              <p className="text-xs text-bone/50 truncate">
                {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            </div>
          </div>
          
          {/* Playback Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={previous} 
              className="p-2 hover:bg-voltage/20 rounded-full transition-colors"
              aria-label="Previous"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 text-bone" />
            </button>
            
            <button 
              onClick={() => isPlaying ? pause() : play(currentVersion, currentVersion.song_id)}
              className="p-2 sm:p-3 bg-voltage hover:bg-voltage/80 rounded-full transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-void" fill="currentColor" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 text-void ml-0.5" fill="currentColor" />
              )}
            </button>
            
            <button 
              onClick={next} 
              className="p-2 hover:bg-voltage/20 rounded-full transition-colors"
              aria-label="Next"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 text-bone" />
            </button>
          </div>
          
          {/* Volume - Desktop Only */}
          <div className="hidden md:flex items-center gap-2 w-24 lg:w-32">
            <Volume2 className="w-4 h-4 text-bone/70" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-bone/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-voltage"
            />
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-2">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={(e) => {
              const time = parseFloat(e.target.value)
              setCurrentTime(time)
              if (audioRef.current) audioRef.current.currentTime = time
            }}
            className="w-full h-1 bg-bone/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-voltage"
          />
        </div>
      </div>
    </div>
  )
}
