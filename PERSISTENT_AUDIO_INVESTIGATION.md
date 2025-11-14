# Persistent Audio Investigation

## 1. Current Architecture

### 1.1 Next.js & Routing
- **Next.js version:** `16.0.1`
- **React version:** `19.2.0`
- **Router type:** **App Router**
  - `app/` directory exists
  - No `pages/` directory
- **Root layout:** `app/layout.tsx`
  - Exists and wraps the entire app
  - Renders `GlobalAudioPlayer` at the root of the HTML body:

```tsx
// app/layout.tsx
import { GlobalAudioPlayer } from "@/components/GlobalAudioPlayer";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="...">
        {children}
        <GlobalAudioPlayer />
      </body>
    </html>
  );
}
```

**Conclusion:** Layout and React tree are persistent across route changes. Any client component rendered here (including `GlobalAudioPlayer`) will **not unmount on navigation**, unless its own render logic conditionally returns `null`.

---

## 2. Audio System Architecture

### 2.1 Global Audio Store

**File:** `lib/audio-store.ts`

- Uses **Zustand** for global, module-scoped state:

```ts
export const useAudioStore = create<AudioState>((set, get) => ({
  currentVersion: null,
  currentSongId: null,
  currentPalette: null,
  queue: [],
  currentIndex: 0,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: /* persisted via localStorage */, 
  // actions: play, pause, stop, setQueue, next, previous, setCurrentTime,
  // setDuration, setVolume, updateTime
}));
```

**Key points:**
- `currentVersion` holds the **currently selected SongVersion** (without album context).
- `isPlaying`, `currentTime`, `duration`, `volume` are all globally stored.
- `volume` is persisted in `localStorage` (`lokitunes-volume`).
- Store is **not tied to any route** → it naturally persists across navigation.

### 2.2 GlobalAudioPlayer

**File:** `components/GlobalAudioPlayer.tsx`

- `'use client'` component rendered in **root layout**.
- Uses `usePathname()` to **hide on the home page**:

```ts
const pathname = usePathname()

// Hide on home page - MiniPlayer handles audio UI there
if (pathname === '/') {
  return null
}
```

- Binds directly to `useAudioStore`:

```ts
const {
  currentVersion,
  currentPalette,
  isPlaying,
  currentTime,
  duration,
  volume,
  play,
  pause,
  next,
  previous,
  setCurrentTime,
  setDuration,
  setVolume,
  updateTime,
} = useAudioStore()
```

- **Audio element lives here**:

```tsx
<audio
  ref={audioRef}
  src={currentVersion?.audio_url || ''}
  style={{ display: 'none' }}
/>
```

- Playback behavior:
  - On `currentVersion` change → call `audio.load()`.
  - On `isPlaying` or `currentVersion.id` change → `audio.play()` or `audio.pause()`.
  - `timeupdate` → `updateTime(audio.currentTime)`.
  - `loadedmetadata` → `setDuration(audio.duration)`.
  - `ended` → `next()`.

- UI:
  - Only shown when `currentVersion` exists.
  - Hidden entirely on `/` due to early `return null`.

### 2.3 MiniPlayer (Home Page)

**File:** `components/MiniPlayer.tsx`

- Also `'use client'` and uses the same `useAudioStore`.
- Rendered at the bottom of the **home page**: `app/page.tsx`.

```tsx
// app/page.tsx
return (
  <div className="relative w-full h-screen bg-void overflow-hidden">
    {/* Orb field scene, etc. */}
    <MiniPlayer />
  </div>
)
```

- Provides **controls + UI only**, NO `<audio>` element.
- Expects playback to be handled by the global `<audio>` in `GlobalAudioPlayer`.

### 2.4 Where the `<audio>` Element Actually Lives

Search for `<audio` in the project shows:
- The **only app-level `<audio>` element** is in `GlobalAudioPlayer.tsx`.
- Node_modules and docs contain `<audio>` references, but not relevant to runtime.

**Conclusion:**
- The **entire playback engine** is bound to `GlobalAudioPlayer`.
- When `GlobalAudioPlayer` returns `null` (e.g. on `/`), there is **no `<audio>` element**, so audio cannot play.

---

## 3. Does Audio Currently Persist Across Navigation?

### 3.1 Theoretical Behavior from Code

Because `GlobalAudioPlayer` is in the root layout **but conditionally returns `null` on the home path**:

- **Album page → Album page navigation**
  - Layout persists; `GlobalAudioPlayer` stays mounted.
  - Audio should continue playing across album-detail → donate, etc. (any non-`/` routes).

- **Album page → Home (`/`)**
  - `usePathname()` changes to `'/'`.
  - `GlobalAudioPlayer` re-renders and hits:

  ```ts
  if (pathname === '/') {
    return null
  }
  ```

  - Result: the entire `GlobalAudioPlayer` component unmounts, including `<audio>`.
  - **Audio stops**, even though the Zustand store still has `currentVersion` + `isPlaying`.
  - `MiniPlayer` is visible on the home page, but there is **no underlying `<audio>` element** to produce sound.

### 3.2 Answers to Key Questions

- **Q: Where is `GlobalAudioPlayer` rendered?**  
  A: In `app/layout.tsx`, at the root of `<body>`.

- **Q: Where is the `<audio>` element?**  
  A: Inside `GlobalAudioPlayer`, and only when `pathname !== '/'`.

- **Q: What state management is used?**  
  A: Global Zustand store `useAudioStore` in `lib/audio-store.ts`.

- **Q: Does audio currently persist across navigation?**  
  A: **Partially.**
  - Between non-home routes: likely YES (layout and `GlobalAudioPlayer` persist).
  - From any non-home route back to `/`: **NO** – `GlobalAudioPlayer` returns `null`, `<audio>` unmounts, playback stops.

---

## 4. Architecture Scenario & Recommendation

### 4.1 Which Scenario Are We In?

From your scenarios:

- **Layout & Zustand are already in place** → good foundation.
- **Playback engine is coupled to `GlobalAudioPlayer` UI and hidden on `/`**.

This is closest to your **Scenario B**:
> "If music stops but state persists... Move audio element to layout ... keep state in global store."

Indeed:
- `useAudioStore` persists across routes (Zustand).
- Layout persists across routes.
- But the `<audio>` element is coupled to `GlobalAudioPlayer` and gets destroyed on `/`.

### 4.2 Recommended Strategy

**Strategy 2 (Audio Element Separation), adapted to your existing setup:**

1. **Extract the audio engine from `GlobalAudioPlayer` into a dedicated component**, e.g. `AudioEngine`.
2. **Render `AudioEngine` unconditionally in `app/layout.tsx`** so the `<audio>` element never unmounts.
3. Let UI components (`MiniPlayer` on home, `GlobalAudioPlayer` on album page) be **pure UI** wired to `useAudioStore`.

This keeps behavior almost identical but guarantees:
- Audio playback persists across navigation, including to `/`.
- You can still decide which UI (Mini vs full player) appears on which routes.

**No new dependencies required.** You already have Next App Router + Zustand + a clean audio store.

---

## 5. Concrete Plan (High-Level)

### 5.1 Files Involved
- `app/layout.tsx`
- `components/GlobalAudioPlayer.tsx`
- `components/MiniPlayer.tsx`
- `lib/audio-store.ts` (unchanged logic, just continues as the single source of truth)

### 5.2 Implementation Steps (NOT DONE YET)

1. **Create `components/AudioEngine.tsx`**
   - `'use client'` component.
   - Move the `<audio>` element and related `useEffect` logic from `GlobalAudioPlayer` into this file:
     - `audioRef`
     - `load()` on `currentVersion` change
     - `play/pause` on `isPlaying` / `currentVersion.id`
     - `timeupdate / loadedmetadata / ended` event handlers.
   - Bind to `useAudioStore` just like `GlobalAudioPlayer` currently does.

2. **Render `AudioEngine` in `app/layout.tsx`**
   - Under `<body>` and above `{children}` or below `{children}` – either is fine visually since `<audio>` is hidden:

   ```tsx
   <body className="...">
     <AudioEngine />  {/* Always mounted, handles playback */}
     {children}
     <GlobalAudioPlayer />  {/* UI for non-home routes */}
   </body>
   ```

3. **Strip the `<audio>` element from `GlobalAudioPlayer`**
   - Remove the `<audio>` tag and the playback side-effects.
   - Keep all UI (buttons, waveform, progress bar) bound to `useAudioStore`.
   - Keep `pathname === '/'` early-return **only for the UI**, not the engine.

4. **Keep `MiniPlayer` as a lightweight UI only**
   - No changes required; it already uses `useAudioStore` and assumes an external engine.

5. **(Optional) Add a small guard to avoid double-control**
   - Ensure that both Global player and Mini player controls operate on the same store (they already do).
   - Because playback happens in `AudioEngine`, any UI can call `play/pause/next/previous` safely.

### 5.3 Testing Plan

- **Test 1: Home → Album → Home**
  1. Start on `/`, with MiniPlayer visible (when a track is selected later).
  2. Navigate to an album page.
  3. Click a Version orb to play.
  4. Navigate back to `/`.
  5. **Expected:** Audio continues playing; MiniPlayer shows the current track; controls still work.

- **Test 2: Album → Donate → Album**
  1. From an album page, start playback.
  2. Navigate to `/donate`.
  3. **Expected:** Audio continues; `GlobalAudioPlayer` UI remains visible (non-home path).

- **Test 3: UI/Engine consistency**
  - While playing, use MiniPlayer controls on home → playback responds immediately.
  - Navigate to album page → `GlobalAudioPlayer` shows same track & time.
  - Use Global player controls → MiniPlayer reflects new state when back on `/`.

- **Test 4: Edge Cases**
  - Volume persistence across refresh (already implemented via `localStorage`).
  - `next`/`previous` behavior with queues on album pages.
  - Behavior when `currentVersion` is `null` (no audio element errors, engine idle).

---

## 6. Difficulty & Risk Assessment

- **Architecture:** Already aligned with recommended pattern (App Router + root layout + Zustand).
- **Needed work:** Mostly a **small refactor** to decouple the `<audio>` element from `GlobalAudioPlayer` UI.

**Estimated effort:**
- Implementation: **30–60 minutes**
- Testing + polish: **30–60 minutes**

**Risk level:**
- **Low–Medium** if refactor is done carefully and tested with the plan above.
- No new libraries or deep structural changes required.

---

## 7. Task 1 (Player Centering) – Notes

- The full player UI (`GlobalAudioPlayer`) is already fixed at the bottom and uses a 3-column flex layout.
- Centering the main controls row will likely involve adjusting the flex alignment in:

```tsx
<div className="flex items-center justify-between w-full gap-4">
  {/* LEFT: track info */}
  {/* CENTER: controls */}
  {/* RIGHT: volume */}
</div>
```

- This is a **separate, simple UI change** and can be applied after we agree on the persistent audio implementation.
