# Vinyl Artwork Display Implementation

## Overview
Added a 3D vinyl disc that appears at the back of the grid when hovering over albums/versions or when playing a track. The vinyl stands upright like a physical record with authentic details.

## Files Created

### `components/AlbumArtworkDisplay.tsx`
New component that renders a vinyl disc with:
- **Black vinyl outer disc** (8 unit radius) with metallic sheen
- **Grooves effect** (dark ring for authenticity)
- **Album artwork** (7 unit radius circle texture)
- **Center label hole** (0.3-0.5 unit ring)
- **Spindle hole** (0.3 unit circle)
- **Accent color glow ring** around vinyl edge

**Effects:**
- Smooth fade in/out based on visibility
- Glitch-style pulsing opacity (85% base + 10% pulse)
- Subtle breathing scale animation
- Gentle rotation wobble for organic feel

## Files Modified

### `components/VersionOrbField.tsx`
**Changes:**
- Added import for `AlbumArtworkDisplay`
- Added vinyl display at position `[0, -5, -45]`
- Shows when `hoveredVersion` or `playingVersion` is active
- Displays version label as title

### `components/OrbField.tsx`
**Changes:**
- Added import for `AlbumArtworkDisplay`
- Added vinyl display at position `[0, -5, -45]`
- Shows when `hoveredAlbum` is active
- Displays album title

## Positioning

```
Camera: z=+20 to +40 (dynamic based on album count)
Orbs: z=0 (center)
Grid: y=-15, size=100 (extends from -50 to +50 in x/z)
Vinyl: [x=0, y=-5, z=-45]
```

**Rotation:** `[Math.PI / 2, 0, 0]` - Standing upright like a real vinyl record

## Visual Design

### Vinyl Layers (front to back):
1. **Glow ring** (z=-0.1) - Accent color halo
2. **Center hole** (z=0.04) - Black spindle hole
3. **Label ring** (z=0.03) - Dark ring around hole
4. **Album art** (z=0.02) - Circular texture with 7 unit radius
5. **Grooves** (z=0.01) - Dark ring (3.5-7.8 radius)
6. **Vinyl disc** (z=0) - Black base (8 unit radius)

### Size Comparison
- Orb radius: ~2.5 units (typical)
- Vinyl radius: 8 units (visible but not overwhelming)
- Distance from camera: ~25-30 units
- Apparent size: Roughly 1/4 to 1/3 orb size when viewed

## Glitch Effect

The glitch is achieved through:
1. **Pulsing opacity** - `Math.sin(t * 2.5) * 0.1` creates 10% opacity fluctuation
2. **Scale breathing** - `1 + Math.sin(t * 1.2) * 0.015` creates 1.5% size pulse
3. **Subtle wobble** - `Math.sin(t * 0.8) * 0.02` creates 2° rotation
4. **Groove animation** - Grooves opacity syncs with main fade

## Texture Loading

Reuses the existing `useSmartTexture` hook:
- Attempts to load from `albumCoverUrl`
- Falls back to colored disc with accent color
- Configured for maximum sharpness (anisotropic filtering)
- SRGB color space for accurate colors

## Performance

- Conditional rendering (only when visible)
- Smooth fade prevents pop-in
- Reuses textures already loaded for orbs
- Low poly count (64 segments for smooth circles)
- Materials use `toneMapped: false` for vibrant colors

## Behavior

### Home Page (OrbField.tsx)
- Shows when hovering over any album orb
- Displays that album's cover art
- Fades out when hover ends

### Album Page (VersionOrbField.tsx)
- Shows when hovering over version orb OR when track is playing
- Displays album cover (all versions share same cover)
- Persists while playing
- Fades out when hover ends AND nothing is playing

## Future Enhancements

Potential additions:
- Rotation animation when playing
- More complex shader-based glitches
- Reflection on grid surface
- Particle effects around vinyl
- Album metadata text on vinyl label
