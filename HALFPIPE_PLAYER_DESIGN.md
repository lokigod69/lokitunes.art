# HALF-PIPE GLOBAL AUDIO PLAYER DESIGN

## Goal

Design a curved "half-pipe" global audio player bar where:

- **Left 0–20%**: Full-height black bar containing cover + controls + track title.
- **Middle 20–80%**: Background dips down in a smooth curve (half-pipe) so the black bar disappears and only a neon progress path is visible at the lowest point.
- **Right 80–100%**: Black bar rises back to full height with waveform visualization.
- **Progress handle**: A draggable orb constrained to the curve path; clicking anywhere on the curve seeks the audio.

Implementation should preserve the existing persistent audio engine (`AudioEngine`) and `useAudioStore` state model.

---

## 1. Curved Background Shape

### 1.1. Overall structure

The player will continue to be a fixed bar at the bottom:

- Container: `fixed bottom-0 left-0 right-0 z-50`.
- Inside: a flex row with three conceptual zones:
  - **Left zone (0–20%)**: Controls + cover + title.
  - **Middle zone (20–80%)**: Curve dip + progress path.
  - **Right zone (80–100%)**: Waveform visualization.

Visually, the black background should be clipped to a **half-pipe-like silhouette** only in the middle, staying full-height on the left and right edges.

### 1.2. SVG approach (recommended)

Use an inline SVG with a `<clipPath>` that defines the half-pipe shape, and apply it to a black background layer that spans the entire bar.

#### 1.2.1. Coordinate system

Let the player bar have dimensions:

- width `W` (100%).
- height `H` (100%).

Define key x positions:

- `x0 = 0` (left edge).
- `x1 = 0.20 * W` (20%): start of curve.
- `x2 = 0.66 * W` (66%): lowest point of curve.
- `x3 = 0.80 * W` (80%): end of curve.
- `x4 = W` (right edge).

For y positions (top is 0, bottom is H):

- Top: `yTop = 0`.
- Bottom: `yBottom = H`.

The path will keep the background at full height at the edges, and "carve out" a dip in the middle:

```svg
<svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
  <defs>
    <clipPath id="halfpipe-clip" clipPathUnits="objectBoundingBox">
      <!--
        Using objectBoundingBox (0–1) coordinates:
        x0=0, x1=0.2, x2≈0.66, x3=0.8, x4=1.
        yTop=0, yBottom=1.
      -->
      <path d="
        M 0,0
        L 0.2,0         
        Q 0.4,1 0.66,1  
        Q 0.8,1 0.8,0   
        L 1,0          
        L 1,1          
        L 0,1          
        Z
      " />
    </clipPath>
  </defs>
</svg>
```

Then apply to the black background layer:

```tsx
<div className="absolute inset-0" style={{ backgroundColor: bgColor, clipPath: 'url(#halfpipe-clip)' }} />
```

Notes:

- Using `clipPathUnits="objectBoundingBox"` allows writing coordinates as 0–1 independent of actual pixel size.
- We may need to wrap the SVG in the same component as the player and ensure the `<defs>` is rendered once.
- The left/right zones (controls + waveform) can sit **above** this clipped background using normal layout.

### 1.3. Alternative: CSS `clip-path`

A simpler, less precise approach is to use a polygon approximation with `clip-path: polygon(...)` in CSS:

```css
clip-path: polygon(
  0% 0%,
  20% 0%,
  30% 60%,
  66% 100%,
  75% 60%,
  80% 0%,
  100% 0%,
  100% 100%,
  0% 100%
);
```

Pros: no SVG required; easier to tweak.

Cons: curve is faceted, not perfectly smooth, and harder to keep the math in sync with the progress handle path.

### 1.4. Responsiveness

- Use **objectBoundingBox** coordinates (0–1) so the shape scales with width and height.
- The player height can be fixed (e.g., 64–72px) to keep curve depth visually consistent.
- On very small viewports, consider reducing the depth of the curve or switching to a flatter layout.

---

## 2. Curve Math for Progress Position

We need a **continuous path** from left to right that defines the vertical position of the progress line and orb.

### 2.1. Piecewise quadratic Bézier model

Use a piecewise function over x ∈ [0, 100] (percent of total width):

1. **Left flat (0–20%)**: y = 0 (top).
2. **Downward curve (20–66%)**: a quadratic Bézier from y=0 to y=100.
3. **Upward curve (66–80%)**: a quadratic Bézier from y=100 back to y=0.
4. **Right flat (80–100%)**: y = 0.

Define helper:

```ts
function quadraticBezier(p0: number, p1: number, p2: number, t: number): number {
  const oneMinusT = 1 - t
  return oneMinusT * oneMinusT * p0 + 2 * oneMinusT * t * p1 + t * t * p2
}
```

Then the curve function:

```ts
// xPercent: 0–100 (progress along the entire bar)
// Returns yPercent: 0–100 (0 = top, 100 = bottom)
function getCurveY(xPercent: number): number {
  const x = Math.max(0, Math.min(100, xPercent))

  if (x < 20) {
    // Flat left section
    return 0
  } else if (x < 66) {
    // Downward curve: from (20, 0) → (66, 100)
    const t = (x - 20) / (66 - 20) // 0–1
    return quadraticBezier(0, 100, 100, t)
  } else if (x < 80) {
    // Upward curve: from (66, 100) → (80, 0)
    const t = (x - 66) / (80 - 66)
    return quadraticBezier(100, 100, 0, t)
  } else {
    // Flat right section
    return 0
  }
}
```

**Edge cases:**

- Clamp input to `[0, 100]` to avoid out-of-bounds.
- For `duration <= 0`, treat progress as 0 and place orb at `(x=0, y=0)`.
- If we later tweak the SVG control points, we should update these thresholds (`20, 66, 80`) to match.

### 2.2. Mapping to actual pixels

Given a container with:

- width `rect.width`.
- height `rect.height`.

We use:

```ts
const xPx = (progressPercent / 100) * rect.width
const yPx = (getCurveY(progressPercent) / 100) * rect.height
```

For CSS `left`/`top` in `%`, we can directly use `progressPercent` and `getCurveY(progressPercent)`.

---

## 3. Interactive Progress Orb on Curve

### 3.1. State and store integration

`useAudioStore` currently exposes `currentTime`, `duration`, and `setCurrentTime`/`seek`-style behavior (we can add a dedicated `seek` action if needed).

Orb component sketch:

```tsx
interface ProgressOrbProps {
  containerRef: React.RefObject<HTMLDivElement>
}

function ProgressOrb({ containerRef }: ProgressOrbProps) {
  const [isDragging, setIsDragging] = useState(false)
  const { currentTime, duration, setCurrentTime } = useAudioStore()

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const yPercent = getCurveY(progress)

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setIsDragging(true)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current || duration <= 0) return

    const rect = containerRef.current.getBoundingClientRect()
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100
    const clampedX = Math.max(0, Math.min(100, xPercent))

    const newTime = (clampedX / 100) * duration
    setCurrentTime(newTime)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }

  return (
    <div
      className="absolute w-4 h-4 rounded-full bg-voltage shadow-lg cursor-pointer"
      style={{
        left: `${progress}%`,
        top: `${yPercent}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  )
}
```

Notes:

- Using **pointer events** instead of separate mouse/touch simplifies cross-device support.
- `setCurrentTime` triggers the `AudioEngine` effect that syncs `audio.currentTime`.
- The orb’s y-position is always computed from the curve; even if the pointer moves off the curve, the orb “snaps back” vertically to the path.

### 3.2. Click-to-seek on curve

We also want clicking anywhere on the curve region to seek:

```tsx
function handleCurveClick(
  e: React.MouseEvent<HTMLDivElement>,
  duration: number,
  setCurrentTime: (time: number) => void,
) {
  if (duration <= 0) return

  const rect = e.currentTarget.getBoundingClientRect()
  const x = e.clientX - rect.left
  const xPercent = (x / rect.width) * 100
  const clampedX = Math.max(0, Math.min(100, xPercent))

  const newTime = (clampedX / 100) * duration
  setCurrentTime(newTime)
}
```

The visual curve used for the path (SVG) should loosely match this `xPercent` domain, but exact y-value at click isn’t needed for seeking; only x-position matters.

---

## 4. Visual Progress Path on Curve

### 4.1. Rendering the curved progress line

Two options:

1. **SVG path for the entire curve** and then stroke only up to the current progress.
2. **Gradient mask** over the curve with a clipped rectangle.

Recommended: SVG path for full control.

Example:

```tsx
<svg className="w-full h-full" preserveAspectRatio="none">
  <defs>
    <clipPath id="halfpipe-curve-area"> ... </clipPath>
  </defs>

  {/* Full path (faint) */}
  <path
    d="M 0,0 L 0.2,0 Q 0.4,1 0.66,1 Q 0.8,1 0.8,0 L 1,0"
    fill="none"
    stroke="rgba(79, 158, 255, 0.3)"
    strokeWidth={2}
  />

  {/* Active portion (0 → progress) could be drawn as a second path or via stroke-dasharray */}
</svg>
```

To show the active segment up to `progress`:

- Precompute the total path length with `getTotalLength()` in a `useEffect`.
- Set `strokeDasharray` to `totalLength` and `strokeDashoffset` based on `progress`.

```tsx
const [pathLength, setPathLength] = useState(0)
const pathRef = useRef<SVGPathElement | null>(null)

useEffect(() => {
  if (pathRef.current) {
    setPathLength(pathRef.current.getTotalLength())
  }
}, [])

const dashOffset = pathLength * (1 - progress / 100)

<path
  ref={pathRef}
  ...
  strokeDasharray={pathLength}
  strokeDashoffset={dashOffset}
/>
```

This yields a smooth neon line filling along the half-pipe curve.

---

## 5. Component Structure

### 5.1. High-level layout

In `GlobalAudioPlayer`:

- Keep the existing top-level container and flex for left controls + right waveform.
- Replace the straight progress bar section with a **HalfPipeProgress** component rendered between them, spanning the middle 60% of width.

Rough structure:

```tsx
<div className="max-w-screen-2xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
  <div className="flex items-center gap-4 w-full">
    <LeftControls ... />
    <HalfPipeProgress ... />
    <RightWaveform ... />
  </div>
</div>
```

Where `HalfPipeProgress` encapsulates:

- The half-pipe shaped background (SVG clip or CSS clip-path).
- The curved SVG progress path.
- The draggable orb.
- The click-to-seek handler.

### 5.2. TypeScript types

Key props for `HalfPipeProgress`:

```ts
interface HalfPipeProgressProps {
  currentTime: number
  duration: number
  accentColor: string
  onSeek: (time: number) => void
}
```

The component will:

- Compute `progress = duration > 0 ? (currentTime / duration) * 100 : 0`.
- Use the curve math (`getCurveY`) and the SVG path for visuals.
- Call `onSeek(newTime)` on drag or click.

---

## 6. Interaction Phases

### Phase 1 – Static Visual (no interactivity)

- Implement `HalfPipeProgress` with:
  - SVG-based background half-pipe clip.
  - Static neon curve path (no filling yet).
  - Left controls and right waveform remain full-height.
- Verify:
  - Curve shape matches design (starts dropping at 20%, bottom at ~66%, rises by 80%).
  - Player still looks good at various viewport widths.

### Phase 2 – Progress Tracking

- Wire `currentTime`/`duration` from `useAudioStore` into `HalfPipeProgress`.
- Implement the SVG path with `strokeDasharray`/`strokeDashoffset` so the curve fills up as the track plays.
- Optional: Add a small glow or animated shimmer to the active portion.

### Phase 3 – Interactivity (Orb + Click-to-seek)

- Add the draggable orb constrained to the curve path using `getCurveY` and pointer events.
- Implement click-to-seek using `handleCurveClick`.
- Ensure smooth updates on both drag and internal time updates (from `timeupdate`).

### Phase 4 – Polish & Responsiveness

- Fine-tune curve depth, stroke width, and orb size.
- Add subtle motion (e.g., the orb glows or pulses when dragging).
- Ensure good behavior on touch devices (test on mobile); tweak pointer targets to be large enough.
- Optimize performance: minimal re-renders, memoizing curve calculations if needed.

---

## 7. Complexity & Risks

- **Curved shape**: straightforward with SVG; low risk.
- **Curve math**: standard quadratic Bézier; low risk.
- **Orb dragging on curve**: moderate complexity; careful handling of pointer capture and store updates required.
- **Responsive behavior**: medium complexity ensuring the curve feels good at various widths.

Estimated effort (for implementation, not just this doc):

- Phase 1: 1–2 hours.
- Phase 2: 2–3 hours.
- Phase 3: 2–3 hours.
- Phase 4: 1–2 hours.

Total: roughly **6–10 hours** of focused work, plus visual tuning time.

---

## 8. Immediate Quick Fixes (Already Planned)

Before implementing the half-pipe design, the following quick fixes should be deployed (and have straightforward, low-risk patches):

1. **Raise RESET button above the player**
   - In `OrbField`, increase the `bottom` style from ~40px to ~80px so the button does not overlap the global player bar.

2. **Make the current straight progress bar clickable for seeking**
   - In `GlobalAudioPlayer`, attach an `onClick` handler to the progress bar container that:
     - Reads `clientX` vs `getBoundingClientRect()`.
     - Computes `percent = x / width`.
     - Calls `setCurrentTime(percent * duration)` from `useAudioStore`.

These quick fixes improve usability immediately while the half-pipe design is being implemented in phases.
