'use client'

import { useState, useEffect } from 'react'
import WaveSurfer from 'wavesurfer.js'

/**
 * Hook to extract real audio waveform peaks from an audio URL using WaveSurfer.js
 * Generates peaks in-memory without DOM rendering
 * 
 * @param audioUrl - URL of the audio file to analyze
 * @param barCount - Number of peak bars to generate (default: 50)
 * @returns Object with peaks array and loading state
 */
export function useWaveformPeaks(audioUrl: string, barCount: number = 50) {
  const [peaks, setPeaks] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!audioUrl) {
      setIsLoading(false)
      return
    }

    let ws: WaveSurfer | null = null

    try {
      // Create a temporary container for WaveSurfer (not added to DOM)
      const tempContainer = document.createElement('div')
      tempContainer.style.display = 'none'

      // Initialize WaveSurfer in memory
      ws = WaveSurfer.create({
        container: tempContainer,
        backend: 'WebAudio',
        height: 0,
        normalize: true,
      })

      // Load audio file
      ws.load(audioUrl)

      // Extract peaks when ready
      ws.on('ready', () => {
        try {
          // Get decoded audio data
          const decodedData = ws?.getDecodedData()
          
          if (decodedData) {
            // Extract channel data (use first channel for mono/stereo)
            const channelData = decodedData.getChannelData(0)
            const samples = channelData.length
            const blockSize = Math.floor(samples / barCount)
            
            // Calculate peak for each bar
            const extractedPeaks: number[] = []
            for (let i = 0; i < barCount; i++) {
              const start = i * blockSize
              const end = start + blockSize
              let peak = 0
              
              for (let j = start; j < end && j < samples; j++) {
                const abs = Math.abs(channelData[j])
                if (abs > peak) peak = abs
              }
              
              extractedPeaks.push(peak)
            }
            
            setPeaks(extractedPeaks)
          }
          
          setIsLoading(false)
        } catch (error) {
          console.error('Error extracting peaks:', error)
          // Fallback to fake peaks
          setPeaks(Array(barCount).fill(0.5))
          setIsLoading(false)
        }
      })

      ws.on('error', (error) => {
        console.error('WaveSurfer error:', error)
        // Fallback to fake peaks on error
        setPeaks(Array(barCount).fill(0.5))
        setIsLoading(false)
      })

    } catch (error) {
      console.error('Failed to create WaveSurfer:', error)
      setPeaks(Array(barCount).fill(0.5))
      setIsLoading(false)
    }

    // Cleanup
    return () => {
      if (ws) {
        ws.destroy()
      }
    }
  }, [audioUrl, barCount])

  return { peaks, isLoading }
}
