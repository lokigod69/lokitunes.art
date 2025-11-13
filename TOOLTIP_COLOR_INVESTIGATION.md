# 🎨 DYNAMIC COLOR-MATCHED TOOLTIP - INVESTIGATION REPORT

**Date:** November 13, 2025  
**Status:** ✅ INVESTIGATION COMPLETE - READY FOR IMPLEMENTATION  
**Risk Level:** 🟢 LOW (Isolated change, won't affect physics)

---

## 📍 PHASE 1: CURRENT TOOLTIP IMPLEMENTATION

### **Location**
- **File:** `components/BubbleOrb.tsx`
- **Lines:** 324-340

### **Current Code**
```typescript
{/* Text label on hover - reduced size with spacing */}
{hovered && (
  <Text
    position={[0, 0, radius * 1.1]}
    fontSize={radius * 0.25}
    color="white"                    // ← STATIC WHITE
    anchorX="center"
    anchorY="middle"
    outlineWidth={0.03}
    outlineColor="black"             // ← STATIC BLACK OUTLINE
    outlineBlur={0.1}
    maxWidth={radius * 2.5}
    textAlign="center"
    letterSpacing={0.05}
  >
    {album.title}
  </Text>
)}
```

### **Key Findings**
- ✅ Uses drei's `<Text>` component (3D text, not HTML)
- ✅ Rotates with orb in 3D space
- ✅ Currently white text with black outline
- ❌ **NO background box** (user may have confused with VersionOrb or browser tooltip)
- ✅ Shows on hover only
- ✅ Positioned above orb at `radius * 1.1`

---

## 🎨 PHASE 2: ALBUM COLOR DATA ANALYSIS

### **Album Interface** (`lib/supabase.ts`)
```typescript
export interface Album {
  id: string
  slug: string
  title: string
  cover_url: string | null
  palette: {
    dominant: string    // ← PRIMARY COLOR (hex)
    accent1: string     // ← SECONDARY COLOR (hex)
    accent2: string     // ← TERTIARY COLOR (hex)
  } | null
  is_public: boolean
  created_at: string
  total_versions?: number
}
```

### **✅ COLOR DATA ALREADY EXISTS!**
The album data structure **already contains a palette object** with:
- `dominant` - Primary color extracted from album cover
- `accent1` - Secondary accent color
- `accent2` - Tertiary accent color

### **Current Usage of Palette Colors**
**BubbleOrb.tsx (line 92):**
```typescript
const glowColor = album.palette?.dominant || album.palette?.accent1 || '#4F9EFF'
```
- **Already using** `palette.dominant` for the orb's glow color!
- Falls back to accent1, then default blue

**SonicOrb.tsx (line 63):**
```typescript
const accentColor = album.palette?.accent1 || '#4F9EFF'
```

**VersionOrb.tsx (line 104):**
```typescript
const glowColor = albumPalette?.dominant || albumPalette?.accent1 || '#4F9EFF'
```

### **Sample Data** (from console logs)
```
Platypus: dominant: '#c8b89a' (beige/tan)
Jenny:    dominant: '#00dddd' (cyan)
Burn:     dominant: '#ff5533' (orange)
```

---

## 🧮 PHASE 3: COLOR CONTRAST LOGIC

### **Luminance Calculation**
```typescript
function getLuminance(hexColor: string): number {
  // Remove # if present
  const hex = hexColor.replace('#', '')
  const rgb = parseInt(hex, 16)
  
  const r = (rgb >> 16) & 0xff
  const g = (rgb >> 8) & 0xff
  const b = (rgb >> 0) & 0xff
  
  // Relative luminance formula (ITU-R BT.709)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}
```

### **Contrast Color Selection**
```typescript
function getContrastColor(bgColor: string): string {
  const luminance = getLuminance(bgColor)
  // Threshold: 0.5
  // Light backgrounds (>0.5) → Black text
  // Dark backgrounds (≤0.5) → White text
  return luminance > 0.5 ? '#000000' : '#ffffff'
}
```

### **Test Matrix**
| Album | Dominant Color | Luminance | Text Color | Outline Color |
|-------|---------------|-----------|------------|---------------|
| Platypus | #c8b89a (tan) | 0.72 | Black | White |
| Jenny | #00dddd (cyan) | 0.68 | Black | White |
| Burn | #ff5533 (orange) | 0.52 | Black | White |
| Dark album | #1a1a2e (dark) | 0.12 | White | Black |

---

## 🎯 PHASE 4: IMPLEMENTATION STRATEGY

### **Recommended Approach: PATH A - Use Existing Palette Data**

**✅ ADVANTAGES:**
- Color data already exists in database
- Already being used for orb glow
- No extraction needed
- Consistent with existing code
- Zero performance overhead

**IMPLEMENTATION PLAN:**

### **Step 1: Create Color Utility Functions**
**File:** `lib/colorUtils.ts` (NEW FILE)
```typescript
/**
 * Calculate relative luminance of a hex color
 */
export function getLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '')
  const rgb = parseInt(hex, 16)
  
  const r = (rgb >> 16) & 0xff
  const g = (rgb >> 8) & 0xff
  const b = (rgb >> 0) & 0xff
  
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/**
 * Get contrasting text color (black or white) for a background color
 */
export function getContrastColor(bgColor: string): string {
  const luminance = getLuminance(bgColor)
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

/**
 * Get inverted outline color (opposite of text)
 */
export function getOutlineColor(textColor: string): string {
  return textColor === '#000000' ? '#ffffff' : '#000000'
}
```

### **Step 2: Update BubbleOrb Tooltip**
**File:** `components/BubbleOrb.tsx`

**Add imports:**
```typescript
import { getContrastColor, getOutlineColor } from '@/lib/colorUtils'
```

**Calculate colors (add after line 92):**
```typescript
// Existing:
const glowColor = album.palette?.dominant || album.palette?.accent1 || '#4F9EFF'

// NEW: Calculate tooltip colors
const tooltipBgColor = album.palette?.dominant || '#4F9EFF'
const tooltipTextColor = getContrastColor(tooltipBgColor)
const tooltipOutlineColor = getOutlineColor(tooltipTextColor)
```

**Update tooltip (replace lines 324-340):**
```typescript
{/* Text label on hover - color-matched to album */}
{hovered && (
  <Text
    position={[0, 0, radius * 1.1]}
    fontSize={radius * 0.25}
    color={tooltipTextColor}           // ← DYNAMIC!
    anchorX="center"
    anchorY="middle"
    outlineWidth={0.03}
    outlineColor={tooltipOutlineColor} // ← DYNAMIC!
    outlineBlur={0.1}
    maxWidth={radius * 2.5}
    textAlign="center"
    letterSpacing={0.05}
  >
    {album.title}
  </Text>
)}
```

### **Step 3: Optional - Add Background Box**
**If you want a background box like VersionOrb:**
```typescript
{hovered && (
  <group>
    {/* Background box - color-matched */}
    <mesh position={[0, 0, radius * 1.1 - 0.1]}>
      <planeGeometry args={[radius * 2.5, radius * 0.4]} />
      <meshBasicMaterial 
        color={tooltipBgColor}
        opacity={0.9}
        transparent
      />
    </mesh>
    
    {/* Text on top */}
    <Text
      position={[0, 0, radius * 1.1]}
      fontSize={radius * 0.25}
      color={tooltipTextColor}
      anchorX="center"
      anchorY="middle"
      maxWidth={radius * 2.5}
      textAlign="center"
      letterSpacing={0.05}
    >
      {album.title}
    </Text>
  </group>
)}
```

### **Step 4: Apply to SonicOrb** (if used)
Same changes to `components/SonicOrb.tsx`

---

## 📊 PHASE 5: TESTING PLAN

### **Pre-Deployment Checklist**
- [ ] Create `lib/colorUtils.ts` with utility functions
- [ ] Test utility functions with sample colors
- [ ] Update `BubbleOrb.tsx` imports
- [ ] Update tooltip color properties
- [ ] Test locally with dev server
- [ ] Verify each album shows correct colors

### **Test Matrix**
| Test Case | Expected Result |
|-----------|-----------------|
| Hover Platypus (tan) | Black text, white outline |
| Hover Jenny (cyan) | Black text, white outline |
| Hover dark album | White text, black outline |
| Color transitions | Smooth (no flicker) |
| Physics | Unchanged |
| Depth push | Still works |
| Reset button | Still works |
| 3D rotation | Tooltip still rotates with orb |

### **Rollback Plan**
```bash
# If anything breaks:
git reset --hard HEAD~1  # Revert last commit
git push origin main --force
```

---

## 🎯 PHASE 6: IMPLEMENTATION ORDER (SAFE & INCREMENTAL)

### **Commit 1: Add Utilities**
```bash
# Create color utility functions
# Test them in isolation
git commit -m "feat: Add color contrast utilities for dynamic tooltips"
```

### **Commit 2: Update BubbleOrb**
```bash
# Apply to BubbleOrb only
# Test thoroughly
git commit -m "feat: Add color-matched tooltips to BubbleOrb"
```

### **Commit 3: Update SonicOrb** (if needed)
```bash
# Apply same changes to SonicOrb
git commit -m "feat: Add color-matched tooltips to SonicOrb"
```

---

## ⚠️ SAFETY CONSIDERATIONS

### **What WON'T Change**
- ✅ Physics simulation (no RigidBody changes)
- ✅ Orb positions and movement
- ✅ Depth push interaction
- ✅ Reset functionality
- ✅ 3D rotation behavior
- ✅ Hover detection
- ✅ Click navigation

### **What WILL Change**
- ✅ Tooltip text color (black or white based on contrast)
- ✅ Tooltip outline color (inverted from text)
- ✅ (Optional) Background box color

### **Potential Issues**
- **Low contrast:** If palette.dominant is mid-tone, might need threshold tuning
- **Missing palette data:** Falls back to default blue (#4F9EFF)
- **Performance:** Minimal - just 2-3 function calls on hover

---

## 📝 SUMMARY

### **✅ READY TO IMPLEMENT**

**What we found:**
1. Tooltip is in `BubbleOrb.tsx` lines 324-340
2. Uses drei's `<Text>` component (3D text, rotates with orb)
3. Currently white text with black outline
4. Album palette data **already exists** with dominant/accent colors
5. Orbs **already use** palette.dominant for glow

**What we need to do:**
1. Create `lib/colorUtils.ts` with contrast calculation
2. Import utilities in `BubbleOrb.tsx`
3. Calculate `tooltipTextColor` and `tooltipOutlineColor`
4. Update `<Text>` color props to use calculated colors
5. Test with various albums

**Risk assessment:**
- 🟢 **LOW RISK** - Isolated change, no physics impact
- 🟢 **SAFE** - Uses existing data structure
- 🟢 **REVERSIBLE** - Easy to rollback if needed

**Expected result:**
- Platypus (tan) → Black text with white outline
- Jenny (cyan) → Black text with white outline
- Dark albums → White text with black outline
- Smooth color transitions
- All existing features preserved

---

## 🚀 NEXT STEPS

1. **Review this document** - Make sure plan looks good
2. **Create `lib/colorUtils.ts`** - Add utility functions
3. **Test utilities** - Verify contrast calculation works
4. **Update `BubbleOrb.tsx`** - Apply dynamic colors
5. **Deploy incrementally** - One commit at a time
6. **Test thoroughly** - Check all albums
7. **Polish** - Tune contrast threshold if needed

**Ready to proceed?** ✅
