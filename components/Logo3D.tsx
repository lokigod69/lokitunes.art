'use client'

import { useEffect, useRef } from 'react'

export function Logo3D() {
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!textRef.current) return
      const scrollY = window.scrollY
      const wobble = Math.sin(scrollY * 0.01) * 2
      textRef.current.style.transform = `skewX(${wobble}deg)`
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="relative py-12 flex justify-center items-center overflow-hidden">
      <h1
        ref={textRef}
        className="text-6xl md:text-8xl font-bold tracking-wider transition-transform duration-200"
        style={{
          background: 'linear-gradient(135deg, #C0C0C0 0%, #E8E8E8 25%, #FFFFFF 50%, #E8E8E8 75%, #C0C0C0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 0 30px rgba(255, 255, 255, 0.3)',
          filter: 'drop-shadow(0 4px 20px rgba(79, 158, 255, 0.3))',
        }}
      >
        LOKI TUNES
      </h1>
    </div>
  )
}
