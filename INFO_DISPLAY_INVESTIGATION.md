# 🎨 INFO DISPLAY CUBE - INVESTIGATION REPORT

**Date:** November 13, 2025  
**Status:** ✅ INVESTIGATION COMPLETE - READY FOR IMPLEMENTATION  
**Concept:** Use decorative wireframe cubes as functional hover info displays

---

## 📍 PHASE 1: DECORATIVE CUBES LOCATED

### **Component File**
- **File:** `components/PulsingWireframe.tsx`
- **Lines:** 1-50

### **Current Implementation**
```typescript
export function PulsingWireframe({ 
  position, 
  size = [10, 10, 10],
  color = '#00ffff'
}: {
  position: [number, number, number]
  size?: [number, number, number]
  color?: string
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  
  useFrame((state) => {
    // Pulse opacity with time
    const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.3 + 0.7
    materialRef.current.opacity = pulse
    
    // Gentle rotation
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.005
      meshRef.current.rotation.y += 0.007
    }
  })
  
  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={size} />
      <meshBasicMaterial 
        ref={materialRef}
        color={color}
        wireframe
        transparent
        opacity={0.7}
      />
    </mesh>
  )
}
```

---

## 📊 PHASE 2: CUBE POSITIONS & PROPERTIES

### **Decorative Cubes** (in `OrbField.tsx` lines 87-90)

| Position | Size | Color | Description |
|----------|------|-------|-------------|
| `[-10, 5, -10]` | `[3, 3, 3]` | `#ff00ff` (Magenta) | Top-left back |
| `[10, 5, -10]` | `[2, 4, 2]` | `#00ffff` (Cyan) | Top-right back |
| `[-10, -5, 10]` | `[4, 2, 4]` | `#00ff88` (Green-Cyan) | **Bottom-left front** ⭐ |
| `[10, -5, 10]` | `[3, 3, 3]` | `#ff00ff` (Magenta) | Bottom-right front |

### **Corner Markers** (lines 93-96)
4 small red cubes `[1, 1, 1]` at corners - can ignore these

---

## 🎯 PHASE 3: TARGET CUBE IDENTIFIED

**Bottom-Left Cube** (most visible, front-facing):
- **Position:** `[-10, -5, 10]`
- **Size:** `[4, 2, 4]` (wide, short)
- **Color:** `#00ff88` (green-cyan)
- **Behavior:** Rotates slowly, pulses opacity
- **Perfect for info display!**

---

## 🔧 PHASE 4: IMPLEMENTATION STRATEGY

### **Approach: Enhanced Wireframe with HTML Info Display**

**Create:** `components/InfoDisplayCube.tsx` (NEW FILE)

```typescript
'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Album } from '@/lib/supabase'
import { getContrastColor } from '@/lib/colorUtils'

interface InfoDisplayCubeProps {
  position: [number, number, number]
  size?: [number, number, number]
  baseColor?: string
  hoveredAlbum: Album | null
}

export function InfoDisplayCube({ 
  position, 
  size = [4, 2, 4],
  baseColor = '#00ff88',
  hoveredAlbum
}: InfoDisplayCubeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  
  // Use album color if hovering, otherwise base color
  const displayColor = hoveredAlbum?.palette?.dominant || baseColor
  const textColor = getContrastColor(displayColor)
  
  useFrame((state) => {
    if (!materialRef.current) return
    
    // Pulse opacity with time
    const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.3 + 0.7
    materialRef.current.opacity = pulse
    
    // Gentle rotation
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.005
      meshRef.current.rotation.y += 0.007
    }
    
    // Update color dynamically
    materialRef.current.color.set(displayColor)
  })
  
  return (
    <group position={position}>
      {/* Rotating wireframe cube */}
      <mesh ref={meshRef}>
        <boxGeometry args={size} />
        <meshBasicMaterial 
          ref={materialRef}
          color={displayColor}
          wireframe
          transparent
          opacity={0.7}
        />
      </mesh>
      
      {/* Info display inside cube */}
      {hoveredAlbum && (
        <Html
          position={[0, 0, 0]}  // Center of cube
          center
          distanceFactor={15}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: displayColor,
              color: textColor,
              padding: '15px 25px',
              borderRadius: '8px',
              fontSize: '18px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              border: `3px solid ${textColor}`,
              whiteSpace: 'nowrap',
              boxShadow: `0 0 30px ${displayColor}, 0 4px 6px rgba(0, 0, 0, 0.3)`,
              backdropFilter: 'blur(4px)',
              transition: 'all 0.3s ease',
            }}
          >
            {hoveredAlbum.title}
          </div>
        </Html>
      )}
    </group>
  )
}
```

---

## 🔗 PHASE 5: STATE MANAGEMENT CONNECTION

### **Update OrbField.tsx:**

```typescript
// Add state for hovered album
const [hoveredAlbum, setHoveredAlbum] = useState<Album | null>(null)

// Pass hover callbacks to orbs
const handleOrbHover = (title: string | null) => {
  if (title) {
    const album = albums.find(a => a.title === title)
    setHoveredAlbum(album || null)
  } else {
    setHoveredAlbum(null)
  }
}

// Replace bottom-left wireframe with InfoDisplayCube
<InfoDisplayCube 
  position={[-10, -5, 10]} 
  size={[4, 2, 4]} 
  baseColor="#00ff88"
  hoveredAlbum={hoveredAlbum}
/>

// Keep other decorative cubes as-is
<PulsingWireframe position={[-10, 5, -10]} size={[3, 3, 3]} color="#ff00ff" />
<PulsingWireframe position={[10, 5, -10]} size={[2, 4, 2]} color="#00ffff" />
<PulsingWireframe position={[10, -5, 10]} size={[3, 3, 3]} color="#ff00ff" />
```

### **Remove tooltip from BubbleOrb.tsx:**

Since the cube will show the info, we can remove the HTML tooltip we just added.

---

## 📊 PHASE 6: EXPECTED RESULT

### **Before (Current):**
```
Small tooltip above orb
         ┌─────────┐
         │Romantick│
         └─────────┘
              ●
```

### **After (New System):**
```
┌──────────────────────────────────────┐
│                                      │
│         [Orbs cluster]               │
│              ●  ●                    │
│            ●      ●  ← Hover orange  │
│              ●  ●                    │
│                                      │
│  ╭─────────────────╮                 │
│  │ ╱──────────╱    │                 │
│  │╱          ╱     │  ← Bottom-left  │
│  │  Romantick      │     cube turns  │
│  │           ╱     │     ORANGE      │
│  ╰─────────────────╯     shows name  │
│  (rotating cube)                     │
└──────────────────────────────────────┘
```

### **Behavior:**
1. **Default:** Cube rotates with green-cyan wireframe, empty
2. **Hover Platypus:** Cube turns tan, shows "PLATYPUS" in black text
3. **Hover Jenny:** Cube turns cyan, shows "JENNY" in black text
4. **Hover away:** Cube returns to green-cyan, text disappears
5. **Smooth transition:** Color and text fade in/out

---

## ✅ PHASE 7: IMPLEMENTATION STEPS

### **Step 1: Create InfoDisplayCube Component**
- Copy `PulsingWireframe.tsx` structure
- Add `hoveredAlbum` prop
- Add dynamic color changing
- Add HTML info display inside cube

### **Step 2: Update OrbField State**
- Add `useState<Album | null>` for hovered album
- Create `handleOrbHover` callback
- Pass to BubbleOrb components

### **Step 3: Replace Bottom-Left Cube**
- Remove: `<PulsingWireframe position={[-10, -5, 10]} .../>`
- Add: `<InfoDisplayCube position={[-10, -5, 10]} ... hoveredAlbum={hoveredAlbum} />`

### **Step 4: Update BubbleOrb**
- Keep the hover detection
- Remove the HTML tooltip (we just added)
- Or keep it as a small label, use cube for main display

### **Step 5: Test**
- Hover over different orbs
- Verify cube changes color
- Verify album name appears inside
- Verify smooth transitions
- Verify rotation continues

---

## 🎯 ADVANTAGES OF THIS APPROACH

✅ **Large, visible display** - Much easier to see than small tooltip  
✅ **Functional decoration** - Turns decoration into UI  
✅ **Fixed position** - Always in same spot (easy to find)  
✅ **Color-matched** - Cube wireframe changes to match album  
✅ **Billboard text** - Always readable (doesn't rotate)  
✅ **Smooth transitions** - Color/text animate nicely  
✅ **Cyberpunk aesthetic** - Fits the neon theme perfectly  
✅ **Performance** - Only 1 HTML element vs many tooltips

---

## 📝 SUMMARY

**Found:**
- 4 decorative `PulsingWireframe` cubes
- Bottom-left at `[-10, -5, 10]` is ideal for info display

**Solution:**
- Create `InfoDisplayCube` component (enhanced PulsingWireframe)
- Add `hoveredAlbum` state to OrbField
- Connect orb hover → display album info in cube
- Cube changes color to match album
- Text appears inside cube with good contrast

**Result:**
- Large, fixed-position info display
- Functional + aesthetic
- Better UX than floating tooltips

**Ready to implement!** 🚀✨
