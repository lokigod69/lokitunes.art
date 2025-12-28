// Canvas-based real-time spectrum visualization for the global audio element.

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAudioStore } from '@/lib/audio-store'
import { useIsMobile } from '@/hooks/useMobileDetection'
import { resumeContextIfNeeded } from '@/lib/audio-analyzer'
import { useSpectrumAnalyzer } from '@/hooks/useSpectrumAnalyzer'

type SpectrumMode = 0 | 1 | 2

const STORAGE_KEY = 'lokitunes-spectrum-mode'
const HEIGHT = 100
const LINE_POINTS = 128
const BAR_COUNT = 64

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

function readCssVar(name: string): string {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function sampleBands(data: Uint8Array, bands: number): number[] {
  const out = new Array<number>(bands).fill(0)
  if (data.length === 0) return out

  for (let i = 0; i < bands; i++) {
    const start = Math.floor((i * data.length) / bands)
    const end = Math.floor(((i + 1) * data.length) / bands)
    const safeEnd = Math.max(start + 1, end)

    let sum = 0
    let count = 0
    for (let j = start; j < safeEnd && j < data.length; j++) {
      sum += data[j]
      count++
    }
    out[i] = count > 0 ? sum / count : 0
  }

  return out
}

export function SpectrumAnalyzer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const isPlaying = useAudioStore((s) => s.isPlaying)
  const currentVersion = useAudioStore((s) => s.currentVersion)
  const isMobile = useIsMobile(768)

  const [mode, setMode] = useState<SpectrumMode>(() => {
    if (typeof window === 'undefined') return 0
    try {
      const raw = window.localStorage?.getItem(STORAGE_KEY)
      const n = raw ? parseInt(raw, 10) : 0
      return (n === 1 || n === 2 ? n : 0) as SpectrumMode
    } catch {
      return 0
    }
  })

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = Math.max(1, window.devicePixelRatio || 1)
    const rect = canvas.getBoundingClientRect()
    const width = Math.max(1, Math.floor(rect.width))

    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(HEIGHT * dpr)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, HEIGHT)
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return

    resizeCanvas()

    const handle = () => resizeCanvas()
    window.addEventListener('resize', handle)

    return () => window.removeEventListener('resize', handle)
  }, [resizeCanvas])

  const clear = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = Math.max(1, Math.floor(canvas.getBoundingClientRect().width))
    ctx.clearRect(0, 0, width, HEIGHT)
  }, [])

  const draw = useCallback(
    (data: Uint8Array) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const width = Math.max(1, Math.floor(canvas.getBoundingClientRect().width))

      ctx.clearRect(0, 0, width, HEIGHT)

      if (!currentVersion || !isPlaying) {
        return
      }

      const palette = {
        dominant: readCssVar('--album-dominant') || '#090B0D',
        accent1: readCssVar('--album-accent1') || '#4F9EFF',
        accent2: readCssVar('--album-accent2') || '#FF6B4A',
      }

      if (mode === 0) {
        const points = sampleBands(data, LINE_POINTS)

        ctx.save()
        ctx.lineWidth = 2
        ctx.strokeStyle = palette.dominant
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.shadowColor = palette.accent1
        ctx.shadowBlur = 10

        ctx.beginPath()

        for (let i = 0; i < points.length; i++) {
          const x = (i / (points.length - 1)) * width
          const y = HEIGHT - clamp01(points[i] / 255) * HEIGHT

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            const prevX = ((i - 1) / (points.length - 1)) * width
            const prevY = HEIGHT - clamp01(points[i - 1] / 255) * HEIGHT
            const cx = (prevX + x) / 2
            const cy = (prevY + y) / 2
            ctx.quadraticCurveTo(prevX, prevY, cx, cy)
          }
        }

        ctx.stroke()
        ctx.restore()
        return
      }

      const bands = sampleBands(data, BAR_COUNT)
      const gap = 2
      const totalGap = gap * (BAR_COUNT - 1)
      const barWidth = (width - totalGap) / BAR_COUNT

      const gradient = ctx.createLinearGradient(0, HEIGHT, 0, 0)
      gradient.addColorStop(0, palette.accent2)
      gradient.addColorStop(1, palette.dominant)

      ctx.fillStyle = gradient

      if (mode === 1) {
        for (let i = 0; i < BAR_COUNT; i++) {
          const amp = clamp01(bands[i] / 255)
          const h = amp * HEIGHT
          const x = i * (barWidth + gap)
          const y = HEIGHT - h
          ctx.fillRect(x, y, barWidth, h)
        }
        return
      }

      const mid = HEIGHT / 2
      for (let i = 0; i < BAR_COUNT; i++) {
        const amp = clamp01(bands[i] / 255)
        const h = amp * mid
        const x = i * (barWidth + gap)
        ctx.fillRect(x, mid - h, barWidth, h)
        ctx.fillRect(x, mid, barWidth, h)
      }
    },
    [currentVersion, isPlaying, mode]
  )

  // Pass isMobile to skip Web Audio connection on mobile (prevents iOS background audio issues)
  useSpectrumAnalyzer(isPlaying, draw, isMobile)

  useEffect(() => {
    if (!isPlaying) {
      clear()
    }
  }, [isPlaying, clear])

  const cycleMode = useCallback(async () => {
    try {
      await resumeContextIfNeeded()
    } catch {
    }

    setMode((prev) => {
      const next = (((prev + 1) % 3) as unknown) as SpectrumMode
      try {
        window.localStorage?.setItem(STORAGE_KEY, String(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  if (isMobile) return null

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8">
      <div className="w-full h-[100px]">
        <canvas
          ref={canvasRef}
          onClick={cycleMode}
          className="w-full h-[100px] cursor-pointer"
        />
      </div>
    </div>
  )
}
