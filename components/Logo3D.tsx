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
    <>
      <div 
        ref={textRef}
        className="relative text-center py-8"
        style={{
          fontSize: '4rem',
          fontWeight: 900,
          letterSpacing: '0.2em',
          color: '#00ffff',
          textShadow: `
            0 0 5px #00ffff,
            0 0 10px #00ffff
          `,
          transform: 'perspective(1000px)',
          transition: 'transform 0.3s ease',
          animation: 'flicker-text 8s infinite alternate',
          opacity: 0.9,
        }}
      >
        LOKI TUNES
      </div>
      
      <style jsx>{`
        @keyframes flicker-text {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
            text-shadow: 
              0 0 5px #00ffff,
              0 0 10px #00ffff;
          }
          20%, 24%, 55% {
            text-shadow: none;
          }
        }
      `}</style>
    </>
  )
}
