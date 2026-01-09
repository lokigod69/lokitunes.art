import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { devLog } from '@/lib/debug'

const resolvedUrlCache = new Map<string, string>()

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'

    img.onload = () => resolve(img)
    img.onerror = (err) => reject(err)

    img.src = url
  })
}

/**
 * Smart texture loader that tries multiple URLs until one works
 * Handles different file extensions (.jpg, .jpeg, .png)
 */
export function useSmartTexture(possibleUrls: string[], albumName: string = 'Unknown') {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const possibleUrlsKey = possibleUrls.join('|')

  useEffect(() => {
    let cancelled = false

    let createdTexture: THREE.Texture | null = null

    async function loadTexture() {
      if (!possibleUrls.length) {
        setTexture(null)
        return
      }

      devLog(`🔍 [${albumName}] Starting texture search...`)
      devLog(`📋 [${albumName}] Trying ${possibleUrls.length} URLs:`, possibleUrls)

      setTexture(null)

      const cachedUrl = resolvedUrlCache.get(possibleUrlsKey)
      const urlsToTry = cachedUrl
        ? [cachedUrl, ...possibleUrls.filter((u) => u !== cachedUrl)]
        : possibleUrls

      for (let i = 0; i < urlsToTry.length; i++) {
        if (cancelled) return

        const url = urlsToTry[i]
        devLog(`🌐 [${albumName}] Attempt ${i + 1}/${urlsToTry.length}: ${url}`)

        try {
          const img = await loadImage(url)
          if (cancelled) return

          const newTexture = new THREE.Texture(img)
          newTexture.colorSpace = THREE.SRGBColorSpace
          newTexture.minFilter = THREE.LinearFilter
          newTexture.magFilter = THREE.LinearFilter
          newTexture.needsUpdate = true

          createdTexture = newTexture
          resolvedUrlCache.set(possibleUrlsKey, url)

          setTexture(newTexture)
          devLog('✅ Texture loaded successfully:', url)
          return
        } catch (e) {
          if (cachedUrl && url === cachedUrl) {
            resolvedUrlCache.delete(possibleUrlsKey)
          }
          devLog(`❌ [${albumName}] FAILED:`, e)
        }
      }

      console.error(`🚨 [${albumName}] ALL URLS FAILED!`)
      devLog(`🚨 [${albumName}] Tried:`, possibleUrls)
    }

    loadTexture()

    return () => {
      cancelled = true

      if (createdTexture) {
        createdTexture.dispose()
      }
    }
  }, [possibleUrlsKey, albumName])

  return texture
}
