'use client'

/**
 * CRT Monitor Scanline Effect
 * Creates retro screen aesthetic with horizontal lines, flicker, and vignette
 */
export function ScanlineEffect() {
  return (
    <>
      {/* Horizontal scanlines */}
      <div 
        className="fixed inset-0 pointer-events-none z-40"
        style={{
          background: `
            repeating-linear-gradient(
              0deg,
              rgba(0, 0, 0, 0) 0px,
              rgba(0, 0, 0, 0.3) 1px,
              rgba(0, 0, 0, 0) 2px,
              rgba(0, 0, 0, 0) 3px
            )
          `,
          animation: 'scanline 8s linear infinite',
        }}
      />
      
      {/* Random flicker */}
      <div 
        className="fixed inset-0 pointer-events-none z-40 opacity-10"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          animation: 'flicker 0.15s infinite',
        }}
      />
      
      {/* Vignette - dark edges */}
      <div 
        className="fixed inset-0 pointer-events-none z-40"
        style={{
          background: `
            radial-gradient(
              circle at center,
              transparent 0%,
              transparent 50%,
              rgba(0, 0, 0, 0.3) 80%,
              rgba(0, 0, 0, 0.6) 100%
            )
          `,
        }}
      />
      
      <style jsx>{`
        @keyframes scanline {
          0% { transform: translateY(0); }
          100% { transform: translateY(100vh); }
        }
        
        @keyframes flicker {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.15; }
        }
      `}</style>
    </>
  )
}
