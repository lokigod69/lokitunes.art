# LokiTunes – Project Architecture

## 1. Project Overview

**LokiTunes** is a 3D, physics‑driven music experience built with Next.js and React Three Fiber. Albums appear as interactive orbs in a zero‑gravity field; each song version becomes its own orb in an album scene. Users explore visually, play versions, and submit anonymous ratings.

- **Core ideas:**
  - 3D orb fields instead of flat lists.
  - Multiple versions per song (original, remix, acoustic, etc.).
  - Color palettes extracted from covers drive the UI theme.
  - Anonymous per‑version rating with comments.
- **Audience:** artists/producers showcasing catalogs; listeners who enjoy exploratory, visual music UIs.

**Tech stack (high level):**

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5.
- **3D & physics:** `@react-three/fiber`, `three`, `@react-three/drei`, `@react-three/rapier`, `@react-three/rapier-addons`, `postprocessing`.
- **Audio:** HTML5 `<audio>` (global engine) + `wavesurfer.js` for waveform players.
- **State:** `zustand` (`lib/audio-store.ts`).
- **Backend:** Supabase (PostgreSQL + Storage) via `@supabase/supabase-js`.
- **Styling:** Tailwind CSS 4 + custom CSS in `app/globals.css`.

---

## 2. Infrastructure & Deployment (Summary)

- **Hosting:** Assumed Vercel (standard Next.js flow). No custom `vercel.json`.
  - Build: `pnpm build` (== `next build`).
  - Output: `.next/`.
  - Auto‑deploy on pushes to `main` (see `DEPLOYMENT_CHECKLIST.md`, `DEPLOYMENT_SUMMARY.md`).
- **Supabase:**
  - URL: `NEXT_PUBLIC_SUPABASE_URL` (example: `https://unbnzgpocplnquthioeu.supabase.co`).
  - Client in `lib/supabase.ts` (`createClient(url, anonKey)`).
  - Tables in `supabase-schema.sql`: `albums`, `songs`, `song_versions` (+ rating tables defined in Supabase).
  - RPC: `increment_play_count(version_id uuid)`.
- **Storage:**
  - Buckets: `covers`, `audio` (public). Policies defined in
    `supabase-storage-permissions.sql` ("Anyone can view covers/audio").
  - Client‑side URL helpers: `lib/supabase-images.ts`.
- **Environment variables:**
  - `NEXT_PUBLIC_SUPABASE_URL` – DB & storage base URL.
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – public key for client.
  - `RATING_IP_SALT` – salt for IP hashing in `lib/ip-hash.ts` (recommended for prod).

---

## 3. File Structure (Key Directories)

**Root:** `lokitunes/`

- `app/` – Next App Router pages and API routes.
- `components/` – React components (3D orbs, players, rating UI, etc.).
- `lib/` – Supabase client, queries, layout helpers, audio store, colors.
- `hooks/` – Reusable React hooks for textures and waveforms.
- `scripts/` – Node/TS scripts to upload/sync content with Supabase.
- `migrations/` – SQL migrations (e.g. add `cover_url` to versions).
- `public/` – Static assets (SVGs).
- Config: `package.json`, `next.config.ts`, `tsconfig.json`, `app/globals.css`, `eslint.config.mjs`, `postcss.config.mjs`.

**app/**

- `layout.tsx` – Root layout. Loads fonts, `globals.css`, mounts:
  - `MonochromeToggle` (global color modes).
  - `AudioEngine` (hidden `<audio>` for global playback).
  - `GlobalAudioPlayer` (fixed bottom bar).
- `page.tsx` – Home page.
  - Client component; calls `getAlbumsWithVersionCounts()`.
  - Chooses `OrbField` (3D scene) or `OrbFieldFallback` (static grid) based on reduced‑motion and WebGL support.
- `album/[slug]/page.tsx` – Server page that:
  - Reads `slug` from params.
  - Calls `getAlbumBySlug(slug)`.
  - `notFound()` if missing; otherwise renders `<AlbumPage album={album} />`.
- `album/[slug]/AlbumPage.tsx` – Client album page.
  - Flattens `album.songs[].song_versions[]` into `ExtendedVersion[]` for `VersionOrbField`.
  - Injects album palette into CSS vars: `--album-dominant`, `--album-accent1`, `--album-accent2`.
  - Renders header (cover, title, song/version counts) + 3D `VersionOrbField`.
- `donate/page.tsx` – Simple static "Support coming soon" page.
- `not-found.tsx` – 404 page with CTA back to `/`.
- `api/extract-palette/route.ts` – `POST { imageUrl }` → `lib/colors.extractPalette()`.
- `api/ratings/route.ts` – `POST /api/ratings` (upsert rating).
- `api/ratings/[versionId]/route.ts` – `GET /api/ratings/:versionId` (stats + user rating + recent comments).

**components/** (high level)

- 3D orb field (home): `OrbField`, `BubbleOrb`, `SonicOrb`, `MouseAttraction`, `InvisibleBounds`, `NeonHeader`, `GridTextDisplay`, `InfoDisplayCube`, `PulsingWireframe`.
- 3D orb field (album): `VersionOrbField`, `VersionOrb`, `AlbumGridTextDisplay`.
- Audio & players: `AudioEngine`, `GlobalAudioPlayer`, `MiniPlayer`, `WaveformPlayer`.
- Rating: `RatingModal`, `RatingStars`, `RatingSummary`, `RatingCommentsList`.
- Album/song UI: `SongRow`, `VersionRow`.
- Aesthetic: `Logo3D`, `ScanlineEffect`, `MonochromeToggle`.

**lib/**

- `supabase.ts` – Supabase client + types for `Album`, `Song`, `SongVersion`, `SongWithVersions`, `AlbumWithSongs`.
- `queries.ts` – `getAlbumsWithVersionCounts`, `getAlbumBySlug`, `incrementPlayCount`.
- `audio-store.ts` – Zustand store for global audio state.
- `orb-layout.ts` – `calculateOrbLayout(count)` and `calculateCameraDistance(count)`.
- `device-detection.ts` – `detectDeviceTier()` and `getQualitySettings(tier)`.
- `ip-hash.ts` – `getClientIp(request)` + `hashIp(ip)` using `RATING_IP_SALT`.
- `supabase-images.ts` – Helpers to generate probable cover URLs from nested folders.
- `colors.ts`, `colorUtils.ts` – Palette extraction (server/scripts) and luminance/contrast helpers.
- `utils.ts` – `cn()` and time formatting helpers.

**hooks/**

- `useSmartTexture` – Tries multiple cover URLs via `fetch HEAD` and constructs a `THREE.Texture`.
- `useWaveformPeaks` – Uses WaveSurfer in a hidden container to derive peak arrays for bars.

**scripts/**

- `upload-content.ts` – Upload local audio/images to Supabase buckets and emit `content-map.json`.
- `seed-albums.ts` – Seed albums/songs/versions based on `albums-to-add.json` + `content-map.json` and extract palettes.
- `sync-content.ts` – Full directory sync to Supabase (detects adds/updates/deletes, optional `--force`).

---

## 4. Core Systems (Very High Level)

### 4.1 Audio System

- **Store (`lib/audio-store.ts`):** tracks `currentVersion`, `currentSongId`, `currentPalette`, `queue`, `currentIndex`, `isPlaying`, `currentTime`, `duration`, `volume`. Exposes `play`, `pause`, `stop`, `setQueue`, `next`, `previous`, `setCurrentTime`, `setDuration`, `setVolume`, `updateTime`.
- **Engine (`components/AudioEngine.tsx`):** single `<audio>` element; reacts to store changes, updates time/duration, calls `next()` on end, applies volume.
- **UI (`GlobalAudioPlayer.tsx`):** cover, label, timer, scrubber, volume slider, "Rate" button. Bound to store and opens `RatingModal`.
- **Waveform (`WaveformPlayer.tsx`):** per‑version WaveSurfer instance, synchronized with the global store (time, volume, play/pause).

### 4.2 3D Orb System

- **Home:** `OrbField` uses `calculateOrbLayout()` and `calculateCameraDistance()` to position album orbs and camera. Physics world uses Rapier; `MouseAttraction` and `InvisibleBounds` control motion range. Orbs are `BubbleOrb` (glass shell + inner cover art) or `SonicOrb` (simpler texture).
- **Album:** `VersionOrbField` renders one orb per song version (`VersionOrb`). Integrates album palette and audio state (the currently playing version orb is frozen in physics).

### 4.3 Rating System

- **Anonymity:** `lib/ip-hash.ts` reads IP from headers and hashes with `RATING_IP_SALT`.
- **API:**
  - `POST /api/ratings` validates payload, upserts into `song_version_ratings` with unique `(version_id, ip_hash)`.
  - `GET /api/ratings/[versionId]` fetches stats (`song_version_rating_stats`), user rating for that IP (if any), and latest 10 comments.
- **UI:** `RatingModal` + `RatingStars` + `RatingSummary` + `RatingCommentsList` provide rating input and community display. Modal is opened via `GlobalAudioPlayer`.

### 4.4 Data Layer

- **Client:** `lib/supabase.ts` exports typed `supabase` client.
- **Queries:** `lib/queries.ts` is the main high‑level data API used by pages:
  - `getAlbumsWithVersionCounts()` – for home page orb field.
  - `getAlbumBySlug(slug)` – for album page.
  - `incrementPlayCount(versionId)` – RPC wrapper.

---

## 5. Configuration & Conventions (Short)

- **next.config.ts:** enables React Compiler, configures remote image domain for Supabase Storage (`*.supabase.co/storage/v1/object/public/**`).
- **tsconfig.json:** `@/*` path alias to project root, strict TS, Next plugin.
- **Styling:** Tailwind CSS 4 via `@tailwindcss/postcss`; CSS variables for core colors and dynamic album palette in `globals.css`. Monochrome modes toggled via `MonochromeToggle` and `html.monochrome-*` classes.
- **Imports & naming:**
  - Components: PascalCase (`OrbField.tsx`, `VersionOrbField.tsx`).
  - Lib utilities: kebab‑case (`orb-layout.ts`, `device-detection.ts`).
  - API routes: `app/api/.../route.ts`.
  - Import alias: `@/` → project root (e.g. `@/lib/supabase`).

---

## 6. Development & Maintenance (Short)

- **Run dev:** `pnpm dev` → `http://localhost:3000`.
- **Build:** `pnpm build` then `pnpm start` (or Vercel build).
- **Content:** use `upload-content.ts`, `seed-albums.ts`, or `sync-content.ts` to manage covers/audio and seed DB.
- **Testing:** see `TESTING_CHECKLIST.md`, `DEPLOYMENT_CHECKLIST.md` for detailed QA steps (orbs render, album pages load, audio plays, ratings save, no console errors, mobile/responsive verification).
- **Docs:** many focused investigation/fix docs exist in root (e.g. `ORB_VISIBILITY_INVESTIGATION.md`, `MOBILE_FIXES.md`) and should be consulted before deep refactors.
