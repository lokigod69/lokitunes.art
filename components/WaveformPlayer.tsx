'use client'

import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { useAudioStore } from '@/lib/audio-store'
import { formatTime, formatTimeRemaining } from '@/lib/utils'
import type { SongVersion } from '@/lib/supabase'
import { devLog } from '@/lib/debug'

interface WaveformPlayerProps {
  version: SongVersion
  songId: string
  accentColor?: string
}

export function WaveformPlayer({ version, songId, accentColor = '#4F9EFF' }: WaveformPlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [localTime, setLocalTime] = useState(0)
  const [localDuration, setLocalDuration] = useState(0)

  const {
    currentVersion,
    currentSongId,
    isPlaying,
    volume,
    play,
    pause,
    setVolume,
    updateTime,
    setDuration,
  } = useAudioStore()

  const { currentPalette } = useAudioStore()
  const waveformColor = currentPalette?.accent1 || accentColor

  const isActive = currentVersion?.id === version.id && currentSongId === songId
  const isCurrentlyPlaying = isActive && isPlaying

  useEffect(() => {
    if (!waveformRef.current) return

    devLog('🎵 Initializing WaveSurfer for:', version.label)
    devLog('📍 Audio URL:', version.audio_url)

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#4A5568',
      progressColor: waveformColor,
      cursorColor: waveformColor,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 60,
      normalize: true,
      backend: 'WebAudio',
    })

    wavesurferRef.current = ws

    // Load audio
    devLog('⏳ Loading audio...')
    ws.load(version.audio_url)

    ws.on('ready', () => {
      devLog('✅ Audio ready, duration:', ws.getDuration())
      setIsLoading(false)
      const duration = ws.getDuration()
      setLocalDuration(duration)
      if (isActive) {
        setDuration(duration)
      }
    })

    ws.on('error', (error) => {
      console.error('❌ WaveSurfer error:', error)
    })

    ws.on('audioprocess', () => {
      const time = ws.getCurrentTime()
      setLocalTime(time)
      if (isActive) {
        updateTime(time)
      }
    })

    ws.on('finish', () => {
      if (isActive) {
        pause()
      }
    })

    return () => {
      ws.destroy()
    }
  }, [version.audio_url, waveformColor])

  // Sync playback state
  useEffect(() => {
    if (!wavesurferRef.current) return

    if (isActive) {
      if (isPlaying) {
        wavesurferRef.current.play()
      } else {
        wavesurferRef.current.pause()
      }
    } else {
      // Pause if another version is playing
      wavesurferRef.current.pause()
    }
  }, [isActive, isPlaying])

  // Sync volume
  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(volume)
    }
  }, [volume])

  const handlePlayPause = () => {
    devLog('🎮 Play/Pause clicked')
    devLog('   isActive:', isActive)
    devLog('   isPlaying:', isPlaying)
    devLog('   wavesurfer:', wavesurferRef.current)
    
    if (isActive) {
      if (isPlaying) {
        devLog('⏸️ Pausing')
        pause()
      } else {
        devLog('▶️ Playing (same version)')
        play(version, songId)
      }
    } else {
      // Switch to this version with fade
      devLog('▶️ Playing (new version)')
      play(version, songId)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
  }

  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
      isActive ? 'bg-album-accent2/10 ring-1 ring-album-accent2/30' : 'bg-void/30'
    }`}>
      {/* Play/Pause Button */}
      <button
        onClick={handlePlayPause}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-voltage hover:bg-voltage/80 transition-colors flex items-center justify-center"
        aria-label={isCurrentlyPlaying ? 'Pause' : 'Play'}
      >
        {isCurrentlyPlaying ? (
          <Pause className="w-5 h-5 text-void" fill="currentColor" />
        ) : (
          <Play className="w-5 h-5 text-void" fill="currentColor" />
        )}
      </button>

      {/* Waveform */}
      <div className="flex-1 min-w-0">
        {isLoading && (
          <div className="h-[60px] flex items-center justify-center">
            <div className="animate-pulse text-bone/50 text-sm">Loading...</div>
          </div>
        )}
        <div ref={waveformRef} className={isLoading ? 'hidden' : ''} />
      </div>

      {/* Time Display */}
      <div className="flex-shrink-0 flex gap-2 text-sm font-mono text-bone/70 min-w-[120px] justify-between">
        <span>{formatTime(localTime)}</span>
        <span>{formatTimeRemaining(localDuration - localTime)}</span>
      </div>

      {/* Volume Control */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {volume === 0 ? (
          <VolumeX className="w-4 h-4 text-bone/50" />
        ) : (
          <Volume2 className="w-4 h-4 text-bone/50" />
        )}
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="w-20 h-1 bg-bone/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-voltage"
          aria-label="Volume"
        />
      </div>
    </div>
  )
}
