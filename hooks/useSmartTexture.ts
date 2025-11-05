import { useEffect, useState } from 'react'
import * as THREE from 'three'

/**
 * Smart texture loader that tries multiple URLs until one works
 * Handles different file extensions (.jpg, .jpeg, .png)
 */
export function useSmartTexture(possibleUrls: string[], albumName: string = 'Unknown') {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const [workingUrl, setWorkingUrl] = useState<string | null>(null)
  
  useEffect(() => {
    let cancelled = false
    
    async function findWorkingUrl() {
      console.log(`🔍 [${albumName}] Starting texture search...`)
      console.log(`📋 [${albumName}] Trying ${possibleUrls.length} URLs:`, possibleUrls)
      
      for (let i = 0; i < possibleUrls.length; i++) {
        if (cancelled) return
        
        const url = possibleUrls[i]
        console.log(`🌐 [${albumName}] Attempt ${i + 1}/${possibleUrls.length}: ${url}`)
        
        try {
          // Try to fetch the image
          const response = await fetch(url, { method: 'HEAD' })
          console.log(`📊 [${albumName}] Response: ${response.status} ${response.statusText}`)
          
          if (response.ok) {
            console.log(`✅ [${albumName}] SUCCESS! Using: ${url}`)
            setWorkingUrl(url)
            return
          }
        } catch (e) {
          console.log(`❌ [${albumName}] FAILED:`, e)
          continue
        }
      }
      
      console.error(`🚨 [${albumName}] ALL URLS FAILED!`)
      console.error(`🚨 [${albumName}] Tried:`, possibleUrls)
      // Still set first URL as fallback
      setWorkingUrl(possibleUrls[0])
    }
    
    findWorkingUrl()
    
    return () => {
      cancelled = true
    }
  }, [possibleUrls.join(','), albumName])
  
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
