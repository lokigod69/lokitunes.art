# Glass Bubble Upgrade - Testing Checklist

## ✅ Build Status: PASSED

Build completed successfully with no TypeScript errors.

---

## 🧪 Quick Testing Guide

### 1. Start Dev Server

```bash
pnpm dev
```

Open: http://localhost:3000

---

## 2. Visual Tests

### Desktop (High Quality)

**Expected Results:**
- [ ] Glass bubbles with transparent outer shell
- [ ] Album art visible inside each bubble
- [ ] Emissive glow matching album colors
- [ ] Bloom effect creating halos around orbs
- [ ] Subtle chromatic aberration on edges
- [ ] Smooth floating motion
- [ ] No black textures

**Check Console (F12):**
```
✅ Texture loaded: [Album Name]
Device Tier: high
```

### Mobile Simulation

**Steps:**
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "iPhone 12 Pro" or similar
4. Refresh page

**Expected Results:**
- [ ] Lower quality (24×24 segments)
- [ ] Bloom effect still visible
- [ ] Smooth 60fps performance
- [ ] Glass bubbles still render

**Check Console:**
```
Device Tier: medium (or low)
```

---

## 3. Interaction Tests

### Mouse/Touch Interaction

- [ ] Hover over orb → cursor changes to pointer
- [ ] Hover → album title appears at top
- [ ] Click orb → navigates to album page
- [ ] Move cursor near orb → orb moves away (repulsion)
- [ ] Move cursor far from orb → orb attracted toward cursor

### Physics Tests

- [ ] Orbs drift naturally with Perlin noise
- [ ] Orbs bounce off invisible walls
- [ ] Orbs stay within viewport
- [ ] No orbs flying off screen
- [ ] Smooth deceleration (not instant stop)
- [ ] Gentle rotation of inner sphere

---

## 4. Performance Tests

### Desktop Performance

**Expected:**
- [ ] 55-60 FPS consistently
- [ ] No stuttering or lag
- [ ] Smooth post-processing effects
- [ ] GPU usage reasonable (<80%)

**Check:**
- Open Chrome Task Manager (Shift+Esc)
- Look for "GPU Process" usage

### Mobile Performance

**Expected:**
- [ ] 60 FPS on modern devices
- [ ] Auto-reduces quality if needed
- [ ] Falls back to SonicOrb if performance drops
- [ ] No browser crashes

---

## 5. Texture Loading Tests

### Success Case

**Check Console:**
```
✅ Texture loaded: Album 1 https://...supabase.co/.../cover.jpg
✅ Texture loaded: Album 2 https://...supabase.co/.../cover.jpg
```

**Visual:**
- [ ] Album covers appear on orbs
- [ ] No black spheres
- [ ] Colors are vibrant (not washed out)

### Error Handling

**If texture fails:**
```
❌ Texture failed: Album Name https://... [Error]
```

**Expected Fallback:**
- [ ] Colored sphere with accent color
- [ ] Emissive glow still works
- [ ] No crash or blank orb

---

## 6. Quality Tier Tests

### Force Low Quality

**Edit `lib/device-detection.ts` temporarily:**
```typescript
export function detectDeviceTier(): DeviceTier {
  return 'low'  // Force low quality
}
```

**Expected:**
- [ ] 16×16 sphere segments (more angular)
- [ ] Bloom only (no chromatic aberration)
- [ ] DPR = 1.0
- [ ] Still looks good, just simpler

### Force Medium Quality

```typescript
return 'medium'  // Force medium quality
```

**Expected:**
- [ ] 24×24 sphere segments
- [ ] Bloom + chromatic aberration
- [ ] DPR = 1.2

---

## 7. Browser Compatibility

### Chrome/Edge (Chromium)
- [ ] Glass bubbles render correctly
- [ ] Post-processing works
- [ ] 60 FPS performance

### Firefox
- [ ] Glass bubbles render correctly
- [ ] Post-processing works
- [ ] Performance acceptable

### Safari (if available)
- [ ] Glass bubbles render correctly
- [ ] Post-processing works
- [ ] Performance acceptable

---

## 8. Fallback Tests

### Reduced Motion

**Enable in OS:**
- Windows: Settings > Accessibility > Visual effects > Animation effects OFF
- Mac: System Preferences > Accessibility > Display > Reduce motion

**Expected:**
- [ ] Static grid layout appears
- [ ] No 3D canvas
- [ ] Album covers as flat circles
- [ ] Still clickable and functional

### WebGL Disabled

**Disable in Chrome:**
1. chrome://flags
2. Search "WebGL"
3. Disable WebGL

**Expected:**
- [ ] Fallback to static grid
- [ ] No errors or crashes

---

## 9. Album Page Tests

**Click any orb to navigate:**

- [ ] Album page loads
- [ ] Color palette applied (unique per album)
- [ ] Songs list visible
- [ ] Version thumbnails appear
- [ ] Audio player works
- [ ] Can navigate back to orb field

---

## 10. Console Error Check

### Should NOT See:

- ❌ CORS errors
- ❌ Texture loading failures
- ❌ WebGL errors
- ❌ Physics errors
- ❌ React errors
- ❌ TypeScript errors

### Should See:

- ✅ Texture loaded messages
- ✅ Clean console (or minor warnings only)

---

## 🐛 Known Issues & Workarounds

### Peer Dependency Warning

**Warning:**
```
WARN Issues with peer dependencies found
postprocessing 6.37.8
└── ✕ unmet peer three@">= 0.157.0 < 0.181.0": found 0.181.0
```

**Status:** ⚠️ Safe to ignore - works fine with Three.js 0.181.0

### First Load Delay

**Issue:** First texture load may take 1-2 seconds

**Expected:** Normal - textures load from Supabase

**Workaround:** Textures are cached after first load

---

## 📊 Performance Benchmarks

### Target Metrics

| Device | FPS | DPR | Segments | Effects |
|--------|-----|-----|----------|---------|
| Desktop | 55-60 | 1.5 | 32×32 | Full |
| Mobile (High) | 60 | 1.2 | 24×24 | Full |
| Mobile (Low) | 60 | 1.0 | 16×16 | Bloom only |

### Acceptable Ranges

- **FPS:** 50+ (desktop), 55+ (mobile)
- **Load Time:** <3s for all textures
- **Memory:** <500MB GPU memory
- **CPU:** <30% on modern hardware

---

## 🚀 Deployment Tests

### After Pushing to GitHub

**Wait 2-3 minutes for auto-deploy**

**Then test production:**

1. Visit: https://lokitunes.art
2. Hard refresh: Ctrl+Shift+R
3. Run all visual tests above
4. Check console for errors
5. Test on real mobile device

**Production-Specific Checks:**
- [ ] HTTPS working
- [ ] Supabase images loading
- [ ] No CORS errors
- [ ] Performance same as local
- [ ] All effects working

---

## ✅ Sign-Off Checklist

Before considering upgrade complete:

- [ ] All visual tests pass
- [ ] All interaction tests pass
- [ ] Performance acceptable on desktop
- [ ] Performance acceptable on mobile
- [ ] No console errors
- [ ] Textures load correctly
- [ ] Glass bubbles render properly
- [ ] Post-processing effects visible
- [ ] Fallbacks work correctly
- [ ] Production deployment successful

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

Desktop Tests:
- Visual: ☐ Pass ☐ Fail
- Interaction: ☐ Pass ☐ Fail
- Performance: ☐ Pass ☐ Fail

Mobile Tests:
- Visual: ☐ Pass ☐ Fail
- Interaction: ☐ Pass ☐ Fail
- Performance: ☐ Pass ☐ Fail

Issues Found:
1. ___________
2. ___________

Overall Status: ☐ Ready ☐ Needs Work
```

---

**Quick Start:** `pnpm dev` → http://localhost:3000 → Check console → Test interactions → Done! 🎉
