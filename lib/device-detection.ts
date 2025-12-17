export type DeviceTier = 'low' | 'medium' | 'high'

export function detectDeviceTier(): DeviceTier {
  if (typeof window === 'undefined') return 'high'
  
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const cores = navigator.hardwareConcurrency || 4
  const memory = (navigator as any).deviceMemory || 4
  
  if (isMobile && (cores < 4 || memory < 4)) {
    return 'low'  // Bloom only, 256 res, 16x16 spheres
  } else if (isMobile) {
    return 'medium'  // Bloom + ChromaticAberration, 24x24 spheres
  }
  return 'high'  // Full effects, 32x32 spheres
}

export function getQualitySettings(tier: DeviceTier) {
  switch (tier) {
    case 'low':
      return {
        sphereSegments: 16,
        dpr: 1.0,
        samples: 4,
        thickness: 0.1,
        roughness: 0.2,
        chromaticAberration: 0,
        bloomIntensity: 0.7,
        multisampling: 4
      }
    case 'medium':
      return {
        sphereSegments: 24,
        dpr: 1.2,
        samples: 6,
        thickness: 0.3,
        roughness: 0.05,
        chromaticAberration: 0.01,
        bloomIntensity: 1.0,
        multisampling: 8
      }
    case 'high':
      return {
        sphereSegments: 32,
        dpr: 1.5,
        samples: 10,
        thickness: 0.3,
        roughness: 0.05,
        chromaticAberration: 0.01,
        bloomIntensity: 1.0,
        multisampling: 8
      }
  }
}
