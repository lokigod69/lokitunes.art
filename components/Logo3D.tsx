'use client'

import { useEffect, useRef } from 'react'

export function Logo3D() {
  const textRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleScroll = () => {
      if (textRef.current) {
        const scroll = window.scrollY
        textRef.current.style.transform = `perspective(1000px) rotateX(${scroll * 0.02}deg)` 
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return (
    <div 
      ref={textRef}
      className="relative text-center py-8"
      style={{
        fontSize: '4rem',
        fontWeight: 900,
        letterSpacing: '0.2em',
        background: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 50%, #ffffff 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        filter: 'drop-shadow(0 4px 12px rgba(255,255,255,0.3))',
        textShadow: '0 1px 0 #ccc, 0 2px 0 #c9c9c9, 0 3px 0 #bbb, 0 4px 0 #b9b9b9, 0 5px 0 #aaa',
        transform: 'perspective(1000px)',
        transition: 'transform 0.3s ease'
      }}
    >
      LOKI TUNES
    </div>
  )
}
