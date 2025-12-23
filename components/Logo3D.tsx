'use client'

import { useEffect, useRef, useState } from 'react'

export function Logo3D() {
  const textRef = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState('4rem')
  
  useEffect(() => {
    const handleResize = () => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
      setFontSize(isMobile ? '2.5rem' : '4rem')
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    
    const handleScroll = () => {
      if (textRef.current) {
        const scroll = window.scrollY
        textRef.current.style.transform = `perspective(1000px) rotateX(${scroll * 0.02}deg)` 
      }
    }
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])
  
  return (
    <>
      <div 
        ref={textRef}
        className="relative text-center pt-14 pb-8 px-4 pr-16 md:pt-8 md:pr-4"
        style={{
          fontSize,
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
          maxWidth: '100%',
          boxSizing: 'border-box',
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
