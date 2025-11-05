import { useEffect, useState } from 'react'
import * as THREE from 'three'

/**
 * Smart texture loader that tries multiple URLs until one works
 * Handles different file extensions (.jpg, .jpeg, .png)
 */
export function useSmartTexture(possibleUrls: string[]) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const [workingUrl, setWorkingUrl] = useState<string | null>(null)
  
  useEffect(() => {
    let cancelled = false
    
    async function findWorkingUrl() {
      console.log('🔍 Trying texture URLs:', possibleUrls)
      
      for (const url of possibleUrls) {
        if (cancelled) return
        
        try {
          // Try to fetch the image
          const response = await fetch(url, { method: 'HEAD' })
          console.log(`${response.ok ? '✅' : '❌'} ${url}: ${response.status}`)
          
          if (response.ok) {
            console.log('🎉 Found working URL:', url)
            setWorkingUrl(url)
            return
          }
        } catch (e) {
          console.log(`❌ ${url}: Failed to fetch`)
          continue
        }
      }
      
      console.warn('⚠️ No working texture found for:', possibleUrls[0])
      // Still set first URL as fallback
      setWorkingUrl(possibleUrls[0])
    }
    
    findWorkingUrl()
    
    return () => {
      cancelled = true
    }
  }, [possibleUrls.join(',')])
  
  // Load texture once we have a working URL
  useEffect(() => {
    if (!workingUrl) return
    
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = workingUrl
    
    img.onload = () => {
      const newTexture = new THREE.Texture(img)
      newTexture.colorSpace = THREE.SRGBColorSpace
      newTexture.needsUpdate = true
      setTexture(newTexture)
      console.log('✅ Texture loaded successfully:', workingUrl)
    }
    
    img.onerror = (err) => {
      console.error('❌ Texture failed to load:', workingUrl, err)
    }
    
    return () => {
      if (texture) {
        texture.dispose()
      }
    }
  }, [workingUrl])
  
  return texture
}
