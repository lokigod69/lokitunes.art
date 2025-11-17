# LokiTunes – Project Architecture


## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Infrastructure & Deployment (Summary)](#2-infrastructure--deployment-summary)
- [3. File Structure (Key Directories)](#3-file-structure-key-directories)
- [4. Core Systems (Very High Level)](#4-core-systems-very-high-level)
- [5. Configuration & Conventions (Short)](#5-configuration--conventions-short)
- [6. Development & Maintenance (Short)](#6-development--maintenance-short)
- [Detailed Architecture – Full Outline (Pass 1)](#detailed-architecture--full-outline-pass-1)
  - [1. Project Overview (Detailed)](#1-project-overview-detailed)
  - [2. Infrastructure & Deployment (Detailed)](#2-infrastructure--deployment-detailed)
  - [3. File Structure & Architecture (Detailed)](#3-file-structure--architecture-detailed)
  - [4. Core Systems & Features (Detailed)](#4-core-systems--features-detailed)
  - [5. Component Hierarchy & Data Flow (Detailed)](#5-component-hierarchy--data-flow-detailed)
  - [6. Key Dependencies (Detailed)](#6-key-dependencies-detailed)
  - [7. Configuration Files (Detailed)](#7-configuration-files-detailed)
  - [8. Features Breakdown](#8-features-breakdown)
  - [9. Development Workflow](#9-development-workflow)
  - [10. Important Patterns & Conventions](#10-important-patterns--conventions)
  - [11. Performance Considerations](#11-performance-considerations)
  - [12. Known Issues & Gotchas](#12-known-issues--gotchas)
  - [13. Troubleshooting](#13-troubleshooting)
  - [14. Contact & Maintenance](#14-contact--maintenance)

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

---

## Detailed Architecture – Full Outline (Pass 1)

> This section mirrors the original requested outline more literally for sections **1–6** and is intentionally more verbose. Later passes will add sections **7–14** (features breakdown, workflow, patterns, performance, known issues, troubleshooting, and maintenance) in the same style.

---

### 1. Project Overview (Detailed)

- **Core concept**
  - **Albums as 3D objects:** Each album is visualized as an orb in a physics-driven field (home page `OrbField`).
  - **Versions as 3D objects:** Each `song_versions` row becomes its own orb in the album view (`VersionOrbField`).
  - **Visual-first exploration:** The primary navigation is *spatial* (orb motion, depth, hovering) rather than text lists.
  - **Anonymous feedback loop:** Ratings are tied to hashed IPs, not accounts, to minimize onboarding friction.

- **Experience goals**
  - **Explorability:** Encourage users to “poke the system” (drag orbs, hover, click) and discover songs serendipitously.
  - **Continuity:** Audio playback persists across routes via a global store and hidden `AudioEngine`.
  - **Album identity:** Each album’s color palette is extracted and used to tint 3D lighting and UI surfaces.
  - **Lightweight backend:** Supabase provides storage, database, and auth primitives without managing custom servers.

- **Primary user types**
  - **Artist / producer:**
    - Upload versions, define albums and songs (via scripts and Supabase).
    - Use the rating system to understand listener preference per version.
  - **Listener / fan:**
    - Explore albums by moving through orb fields.
    - Compare different mixes/versions.
    - Rate and optionally comment on specific versions.

- **Tech stack deep dive**
  - **Frontend & framework**
    - **Next.js 16 (App Router)** – file-based routing under `app/`, server + client components, route handlers in `app/api/*/route.ts`.
    - **React 19** – concurrent rendering, hooks, and component ecosystem.
    - **TypeScript 5** – type safety across data layer, components, and scripts.
  - **3D & physics**
    - **`@react-three/fiber`** – React reconciler for `three`, powering `<Canvas>` scenes in `OrbField` and `VersionOrbField`.
    - **`three`** – underlying 3D engine used for materials, meshes, cameras, vectors, and manual math.
    - **`@react-three/drei`** – helpers like `MeshTransmissionMaterial` for glass-like materials.
    - **`@react-three/rapier` & `@react-three/rapier-addons`** – physics world (rigid bodies, colliders, impulses).
    - **`@react-three/postprocessing` & `postprocessing`** – optional post-processing (glow, effects) for the scenes.
  - **Audio & interaction**
    - **HTML `<audio>`** – single global audio element inside `AudioEngine`.
    - **`wavesurfer.js`** – per-version waveform rendering in `WaveformPlayer` (used in album details views).
    - **`zustand`** – global audio store, controlling which version is playing, playback time, volume, and queue.
  - **Backend & data**
    - **Supabase** – PostgreSQL, Row Level Security, Storage, and functions (e.g. `increment_play_count`).
    - **`@supabase/supabase-js`** – typed client, used in `lib/supabase.ts` and `lib/queries.ts`.
  - **Styling & UI helpers**
    - **Tailwind CSS 4** – core utility classes and modern Tailwind features via `@tailwindcss/postcss`.
    - **Global CSS** – `app/globals.css` for color variables, monochrome modes, scrollbars, and layout primitives.
    - **`clsx` / `tailwind-merge` / `class-variance-authority`** – helpers to build class strings and variants.
    - **`lucide-react`** – iconography for buttons and UI chrome.
  - **Color & palette**
    - **`node-vibrant`** – used in scripts to extract dominant/accent colors from covers.
    - **`colors.ts` / `colorUtils.ts`** – transform palettes into the format used by the UI and ensure sufficient contrast.

- **High-level data shape**
  - **Album (`public.albums`)** – identified by `slug`, has `title`, `cover_url`, `palette`, `is_public`.
  - **Song (`public.songs`)** – belongs to an album, has `title`, optional `track_no`.
  - **SongVersion (`public.song_versions`)** – belongs to a song, has `label`, `audio_url`, optional `cover_url`, `duration_sec`, `waveform_json`, `play_count`.
  - **Rating (`song_version_ratings`)** – belongs to a version (and song), has numeric `rating` (1–10), optional short `comment`, `ip_hash` for anonymity.
  - **RatingStats (`song_version_rating_stats`)** – pre-aggregated per-version summary (average rating, count, etc.; defined in Supabase).

---

### 2. Infrastructure & Deployment (Detailed)

- **2.1 Hosting & runtime**
  - **Platform:** The app is designed for **Vercel’s** Next.js runtime (documented in `DEPLOYMENT_SUMMARY.md`).
  - **Build command:** `pnpm build` (which runs `next build`).
  - **Start command (self-hosted or preview):** `pnpm start` → `next start`.
  - **Output:** `.next/` directory with server and client artifacts.
  - **Target domain:** A production deployment such as `https://lokitunes.art` (as documented in deployment summary files).

- **2.2 Supabase project**
  - **Project URL:** Set via `NEXT_PUBLIC_SUPABASE_URL` (example: `https://unbnzgpocplnquthioeu.supabase.co`).
  - **Anon key:** Exposed to the client via `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - **Client configuration:**
    - Implemented in `lib/supabase.ts`.
    - Uses `createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)`.
    - Exported `supabase` instance is used throughout `lib/queries.ts` and API route handlers.
  - **Database schema:** (see `supabase-schema.sql`)
    - **`public.albums`** – albums table with `slug`, `title`, `cover_url`, `palette`, `is_public`, timestamps.
    - **`public.songs`** – songs table linking to albums via `album_id`.
    - **`public.song_versions`** – versions per song with `audio_url`, `cover_url`, `duration_sec`, `waveform_json`, `play_count`.
    - **Indexes:** `idx_songs_album_id`, `idx_song_versions_song_id`, `idx_albums_slug`, `idx_albums_is_public` for efficient queries.
    - **Function:** `increment_play_count(version_id uuid)` used by `lib/queries.ts`.
  - **Row Level Security (RLS):**
    - Enabled for `albums`, `songs`, `song_versions`.
    - Policies restrict read access to albums where `is_public = true` and cascade that condition down to songs and versions.

- **2.3 Storage buckets**
  - Defined and documented in `supabase-storage-permissions.sql`.
  - **Buckets:**
    - **`audio` (public):** stores audio files referenced by `song_versions.audio_url`.
    - **`covers` (public):** stores album and version cover images referenced by `cover_url`.
  - **Access:**
    - Read: public (anyone can fetch audio and covers via signed or public URLs).
    - Write: via scripts (`upload-content.ts`, `sync-content.ts`) using service-role credentials (not in this repo).
  - **Client helpers:** `lib/supabase-images.ts` constructs canonical public URLs from known patterns.

- **2.4 Environment variables (detailed)**

| Name                       | Required | Used in           | Description                                                          |
| -------------------------- | -------- | ----------------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes      | `lib/supabase.ts` | Base URL for Supabase project (database + storage).                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | `lib/supabase.ts` | Public anon key used by browser and server components.               |
| `RATING_IP_SALT`           | Recommended | `lib/ip-hash.ts` | Salt appended to IP before hashing for anonymous user identification. |

- **2.5 Build & deployment flow**
  - **Local development:**
    - Ensure `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
    - Run `pnpm dev` → launches `next dev` on `http://localhost:3000`.
    - Hot reloading applies to both 3D scenes and standard React components.
  - **Production build:**
    - Run `pnpm build` → `next build`.
    - Artifacts produced in `.next/` (server, client, and middleware bundles).
  - **Production runtime:**
    - `pnpm start` for custom hosting, or Vercel’s managed runtime for the main site.
    - Environment variables configured in hosting platform settings.

- **2.6 Security considerations (infra-level)**
  - **Database:**
    - RLS ensures only `is_public = true` albums (and their songs/versions) are readable.
    - Write operations from the public client are limited to rating-related tables.
  - **Storage:**
    - Public buckets are readable by everyone; only publish non-sensitive assets.
    - Service-role keys and heavy operations (upload/sync) are kept in scripts / external config, not committed here.
  - **Environment variables:**
    - Secrets like service-role keys are never present in this repo.
    - `RATING_IP_SALT` should be set to a long, random value in production and rotated cautiously if needed.

---

### 3. File Structure & Architecture (Detailed)

This section expands on the earlier overview, focusing on responsibilities and import direction.

- **3.1 Directory responsibilities**
  - **`app/`** – entrypoints and routing.
    - All pages and API routes live here.
    - Only **thin orchestration logic**; heavy business logic belongs in `lib/`.
  - **`components/`** – UI and scene building blocks.
    - React components that consume data and state but do not directly talk to Supabase.
  - **`lib/`** – data, state, and shared logic.
    - Supabase client, queries, physics/layout helpers, color utilities, IP hashing.
  - **`hooks/`** – reusable hooks that encapsulate imperative libraries.
  - **`scripts/`** – Node/TS entrypoints for off-line operations (upload, seed, sync).
  - **`migrations/`** – SQL files used to evolve the Supabase schema.
  - **`public/`** – static assets served directly by Next.js (`/favicon.svg`, other SVGs).

- **3.2 Import direction & layering**
  - `lib/` **does not** import from `components/` or `app/`.
  - `components/` can import from `lib/` and `hooks/`.
  - `app/` can import from `components/`, `lib/`, and `hooks/`.
  - `scripts/` typically import from `lib/` (e.g., Supabase helpers, palette utilities) but not from `app/`.

- **3.3 Example: album page path**
  - Route file: `app/album/[slug]/page.tsx`.
    - Server component: reads `slug` from params and calls `getAlbumBySlug(slug)` from `lib/queries.ts`.
    - On failure: calls `notFound()` → `app/not-found.tsx`.
    - On success: renders `<AlbumPage album={album} />`.
  - Client album component: `app/album/[slug]/AlbumPage.tsx`.
    - Flattens `album.songs[].song_versions[]` into `ExtendedVersion[]` (ID, song title, track number, etc.).
    - Calculates or uses a palette to set CSS variables like `--album-dominant` and `--album-accent1`.
    - Renders layout: header (cover, title), `VersionOrbField` (3D versions), plus song/version list below.

---

### 4. Core Systems & Features (Detailed)

#### 4.1 Audio System (end-to-end)

- **State (`lib/audio-store.ts`)**
  - Tracks `currentVersion`, `currentSongId`, `currentPalette`, `queue`, `currentIndex`, `isPlaying`, `currentTime`, `duration`, `volume`.
  - Persisted `volume` in `localStorage` ensures user’s loudness preference survives reloads.
- **Engine (`components/AudioEngine.tsx`)**
  - Owns a single `<audio>` element.
  - Subscribes to the store and sets `audio.src` when `currentVersion` changes.
  - Forwards `timeupdate`, `loadedmetadata`, and `ended` events back into the store.
- **Global player (`components/GlobalAudioPlayer.tsx`)**
  - UI layer over the store:
    - Shows metadata from `currentVersion` (song title, version label, cover art).
    - Provides `Play/Pause`, `Next`, `Previous`, and volume control.
    - Offers `Rate` entrypoint which opens `RatingModal`.
- **Waveform players (`components/WaveformPlayer.tsx`)**
  - For each version row, renders a mini waveform synced to the global audio state.
  - Uses `wavesurfer.js` to render peaks and respond to scrubbing.

#### 4.2 3D Orb System (end-to-end)

- **Home scene (`components/OrbField.tsx`)**
  - Uses `@react-three/fiber` to create a `<Canvas>` and a Rapier physics world.
  - Computes positions with `calculateOrbLayout(albumCount)`.
  - Renders one `BubbleOrb` per album, passing album metadata and callbacks.
- **Album scene (`components/VersionOrbField.tsx`)**
  - Similar structure but parameterized by `ExtendedVersion[]` and album palette.
  - Each `VersionOrb` is aware of whether it is the currently playing version and freezes physics accordingly.
- **Shared physics behaviors**
  - Orbs are dynamic rigid bodies with low damping and no gravity (`gravityScale={0}`).
  - `MouseAttraction` and pointer handling in `BubbleOrb` / `VersionOrb` combine to create a responsive, tactile field.
  - `InvisibleBounds` prevents orbs from drifting too far away.

#### 4.3 Rating System (end-to-end)

- **Data model**
  - `song_version_ratings` – individual user-equivalent ratings keyed by `(version_id, ip_hash)`.
  - `song_version_rating_stats` – aggregate stats per version (queried but not defined in this repo’s SQL).
- **API**
  - `POST /api/ratings` – validates rating, hashes IP, upserts into `song_version_ratings`, returns updated stats.
  - `GET /api/ratings/[versionId]` – returns stats, optional user rating for the current IP, and latest comments.
- **IP hashing (`lib/ip-hash.ts`)**
  - `getClientIp(request)` looks at `x-forwarded-for` and `x-real-ip` headers.
  - `hashIp(ip)` uses SHA-256 with `RATING_IP_SALT` to avoid storing raw IPs.
- **UI orchestration**
  - `GlobalAudioPlayer` passes the active `versionId` into `RatingModal`.
  - `RatingModal` fetches existing data via GET, then sends POST on submit.

#### 4.4 Data Layer

- **Supabase client (`lib/supabase.ts`)**
  - Single configured client instance reused by queries and API routes.
  - Central place to adjust auth or connection options.
- **Queries (`lib/queries.ts`)**
  - `getAlbumsWithVersionCounts()` – list albums and counts for the home page.
  - `getAlbumBySlug(slug)` – fetch full album tree for the album view.
  - `incrementPlayCount(versionId)` – call Postgres function, enabling server-side counting.

---

### 5. Component Hierarchy & Data Flow (Detailed)

- **5.1 Home page (`/`) hierarchy**
  - `RootLayout`
    - `MonochromeToggle`
    - `AudioEngine`
    - `GlobalAudioPlayer`
    - `HomePage` (`app/page.tsx`)
      - `OrbField` (or fallback)
        - `BubbleOrb` × N
        - `MouseAttraction`
        - `InvisibleBounds`
        - `NeonHeader`, `Logo3D`, `GridTextDisplay`, `InfoDisplayCube`, `PulsingWireframe`, `ScanlineEffect`

- **5.2 Album page (`/album/[slug]`) hierarchy**
  - `RootLayout`
    - `MonochromeToggle`
    - `AudioEngine`
    - `GlobalAudioPlayer`
    - `AlbumPageServer` (`page.tsx`)
      - `AlbumPage` (`AlbumPage.tsx`)
        - `VersionOrbField`
          - `VersionOrb` × M
          - `AlbumGridTextDisplay`
        - `SongRow` × (# songs)
          - `VersionRow` × (# versions per song)
            - `WaveformPlayer` (inside)

- **5.3 Data flow: Play → Rate**
  - **Play:** User clicks a `VersionOrb` or `WaveformPlayer` play button → calls `useAudioStore.play` → `AudioEngine` updates `<audio>` → `GlobalAudioPlayer` and `WaveformPlayer` sync UI.
  - **Rate:** While playing, user clicks `Rate` → `RatingModal` opens → GET `/api/ratings/[versionId]` → user submits → POST `/api/ratings` → UI re-renders with updated stats.

---

### 6. Key Dependencies (Detailed)

| Package                      | Version   | Category        | Used for                                                                 |
| ---------------------------- | --------- | --------------- | ------------------------------------------------------------------------ |
| `next`                       | `16.0.1`  | Framework       | App Router, routing, server components, metadata, and build pipeline.    |
| `react`                      | `19.2.0`  | UI core         | Component model and hooks.                                               |
| `react-dom`                  | `19.2.0`  | UI core         | DOM renderer for React.                                                  |
| `@react-three/fiber`         | `^9.4.0`  | 3D / rendering  | React binding for `three`, driving all 3D scenes.                        |
| `three`                      | `^0.181.0`| 3D / rendering  | Core 3D engine for meshes, materials, and cameras.                       |
| `@react-three/drei`          | `^10.7.6` | 3D helpers      | Helpers such as `MeshTransmissionMaterial`.                              |
| `@react-three/postprocessing`| `^3.0.4`  | 3D post FX      | React bindings for `postprocessing`.                                     |
| `postprocessing`             | `^6.37.8` | 3D post FX      | Bloom and other post-processing effects.                                 |
| `@react-three/rapier`        | `^2.2.0`  | Physics         | Rapier physics world integration.                                        |
| `@react-three/rapier-addons` | `^5.0.0`  | Physics helpers | Higher-level helpers around Rapier.                                      |
| `wavesurfer.js`              | `^7.11.1` | Audio waveform  | Rendering waveforms for `WaveformPlayer`.                                |
| `zustand`                    | `^5.0.8`  | State mgmt      | Global audio store (`useAudioStore`).                                    |
| `@supabase/supabase-js`      | `^2.78.0` | Data / backend  | Supabase client for Postgres and Storage.                                |
| `node-vibrant`               | `^4.0.3`  | Palette         | Palette extraction from cover images in scripts/utilities.               |
| `class-variance-authority`   | `^0.7.1`  | Styling helpers | Tailwind-friendly variants for components.                               |
| `clsx`                       | `^2.1.1`  | Styling helpers | Conditional className construction.                                      |
| `tailwind-merge`             | `^3.3.1`  | Styling helpers | Merging Tailwind classes deterministically.                              |
| `lucide-react`               | `^0.552.0`| Icons           | Icons used throughout LokiTunes UI.                                      |
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
React Compiler
reactCompiler: true enables the experimental React Compiler to optimize React components.
This can make some non-standard patterns risky (e.g. mutating props, weird closure captures).
Image configuration
Allows Next’s <Image> to load from Supabase Storage (*.supabase.co/storage/v1/object/public/**).
Ensures album/track covers served from Supabase can be optimized and cached via Next.***
7.2 
tsconfig.json
Key aspects:

Compiler options
"strict": true – strict TypeScript across the project.
"module": "esnext", "moduleResolution": "bundler" – aligned with Next 16 bundling.
"jsx": "react-jsx" – modern JSX transform.
"noEmit": true – TS doesn’t emit JS; Next handles transpilation.
"plugins": [{ "name": "next" }] – Next-specific TS plugin (better route and config types).
Paths
"@/*": ["./*"] – alias 
/
 to project root.
Used heavily to avoid ../../../lib/queries style imports.
Include/exclude
Includes **/*.ts, **/*.tsx, .next/types/**/*.ts, etc.
Excludes 
node_modules
 for faster, focused type checking.*
7.3 ESLint configuration (
eslint.config.mjs
)
ts
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
Extends Next core web vitals rules plus TS rules.
Ignores only build outputs and Next’s env type file.
Ensures consistent linting across 
app/
, 
components/
, 
lib/
, and 
scripts/
.
7.4 PostCSS & Tailwind (
postcss.config.mjs
)
ts
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
Uses Tailwind’s official PostCSS plugin as the only configured plugin.
Tailwind 4 drives utility generation; global CSS and tokens live in 
app/globals.css
.
7.5 Environment configuration (
.env.local
)
Expected keys (also see Section 2.4):
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
RATING_IP_SALT (recommended in production)
.env.local
 is gitignored.
In production, these live in the hosting provider’s env config (e.g. Vercel project settings).
8. Features Breakdown
This section tracks which conceptual features exist today and which are planned.

8.1 Implemented features
 3D orb home field with physics (React Three Fiber + Rapier).
 Album orb immersion with per-version orbs on album pages.
 Waveform players using WaveSurfer.js per version.
 Global audio engine with persistent playback and mini/global player.
 Per-version ratings with anonymous IP-hashed identity.
 Comments per rating (short text, trimmed and capped at 200 chars).
 Dynamic album palettes from cover art (node-vibrant + color utils).
 Reduced-motion fallback to static grid when motion is disabled or WebGL unavailable.
 Device-tier scaling for orb quality and postprocessing.
 Content scripts for upload/seed/sync (upload-content, seed-albums, sync-content).
 Deployment workflow documented for Vercel + Supabase.
8.2 Partially implemented / planned features
From 
README.md
 and docs:

 Keyboard shortcut: Space to play/pause.
 Keyboard shortcuts: ← / → to seek ±5s (marked “coming soon”).
 Keyboard shortcuts: ↑ / ↓ for volume (marked “coming soon”).
 Play count visualization as orb glow intensity driven by play_count.
 Download original WAV option per version.
 Remix lineage visualization (graph/tree of versions).
 Comment threads per version (nested discussion).
 Art gallery section (Loki Layer) separate from music orbs.
 Advanced analytics (per-device performance, rating distributions, etc.).
9. Development Workflow
High-level from 
README.md
, 
SETUP_GUIDE.md
, 
CONTENT_WORKFLOW.md
, 
DEPLOYMENT_CHECKLIST.md
.

9.1 Local setup
Clone + install
pnpm install
Supabase project
Create project at supabase.com.
Run 
supabase-schema.sql
 in SQL Editor.
Create covers and audio buckets (public).
Environment variables
Copy .env.local.example → 
.env.local
 (if present).
Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY.
Run dev server
pnpm dev → http://localhost:3000.
9.2 Content workflow
Two paths: scripted (preferred) vs manual.

Scripted workflow (
CONTENT_WORKFLOW.md
):
Prepare folder of covers + audio per album.
pnpm upload-content ~/path/to/content → uploads files, creates content-map.json.
cp albums-to-add.example.json albums-to-add.json and customize (slug, songs, versions, filenames).
pnpm seed-albums albums-to-add.json → inserts albums/songs/versions with URLs.
Visit site → new album orbs should appear.
Manual workflow (
SETUP_GUIDE.md
):
Upload covers to covers bucket; audio to audio bucket.
Insert albums into albums table (slug, title, cover_url, is_public).
Insert songs into songs table.
Insert versions into song_versions with audio_url and optional fields.
9.3 Testing workflow
Local testing (see 
TESTING_CHECKLIST.md
, 
DEPLOYMENT_CHECKLIST.md
):
Run pnpm dev.
Verify:
Orbs render and animate.
Hover shows titles and pointer changes.
Clicking orbs navigates to album pages.
Waveform players and audio playback work.
Mini/global player shows correct song/version.
Reduced-motion and no-WebGL fallbacks work.
No critical console errors.
9.4 Deployment workflow (Vercel)
Push code to GitHub (or similar).
In Vercel: create project, import repo.
Configure:
Framework preset: Next.js.
Build command: pnpm build.
Output: 
.next
.
Env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, RATING_IP_SALT.
Deploy, wait for completion.
Run basic production smoke test (home orbs, album, audio, ratings).
9.5 Common maintenance tasks
Add a new album
Scripts: edit albums-to-add.json → pnpm upload-content → pnpm seed-albums.
Manual: insert via Supabase Table Editor.
Adjust orb physics
BubbleOrb.tsx
, 
VersionOrb.tsx
 for body params.
OrbField.tsx, VersionOrbField.tsx for camera, forces, postprocessing.
Change rating behavior
API: 
app/api/ratings/route.ts
, app/api/ratings/[versionId]/route.ts.
UI: RatingModal, RatingStars, RatingSummary, RatingCommentsList.
10. Important Patterns & Conventions
10.1 State management
Global: zustand store in 
lib/audio-store.ts
 for audio only.
Local: React useState/useEffect for component-specific state.
Prefer derived data in selectors / components instead of duplicating in state.
10.2 Styling
Tailwind CSS 4 for most layout/typography.
Design tokens and palette variables in 
app/globals.css
.
Dynamic album palettes via CSS vars (e.g. --album-dominant).
Use clsx + tailwind-merge, optionally class-variance-authority for variants.
10.3 3D & physics conventions
Use React Three Fiber declaratively; avoid manual three.Scene mutations.
Use Rapier rigid bodies, not manual per-frame position mutations.
Keep physics tuning close to orb components.
Use helper utilities:
orb-layout.ts
 for positions and camera distance.
device-detection.ts for quality tiers.
10.4 Type safety
Supabase entity types live in lib/supabase.ts.
API routes return clear JSON envelopes (error, stats, userRating, comments, etc.).
Strict TS config + ESLint keep public surfaces consistent.
10.5 File naming & structure
Components: PascalCase (OrbField.tsx, GlobalAudioPlayer.tsx).
Lib modules: lower/kebab (
orb-layout.ts
, 
audio-store.ts
).
Hooks: useSomething.ts.
API routes: app/api/<name>/route.ts or app/api/<name>/[param]/route.ts.
11. Performance Considerations
11.1 3D performance
Device tier detection (lib/device-detection.ts):
Returns DeviceTier (low, medium, high).
getQualitySettings(tier) maps to sphere segments, DPR, and postprocessing options.
Quality scaling
High tier: more segments, more effects, higher DPR.
Lower tiers: fewer segments and effects, lower DPR.
Fallbacks
If WebGL is unavailable or reduced motion is set, the home page uses a static grid fallback.
Texture loading
useSmartTexture:
Tries multiple candidate URLs.
Optimizes texture settings (filters, SRGB, etc.).
Falls back to simple colored spheres if texture load fails.
11.2 Database & network
Indexes on:
albums.slug, albums.is_public
songs.album_id
song_versions.song_id
Ratings:
Use song_version_rating_stats for aggregates instead of recomputing on each request.
Network:
Supabase Storage URLs are long-lived and cacheable; consider HTTP cache headers if needed.
11.3 Bundle size
Heavy libs (three, 
react-three/*
, postprocessing, wavesurfer.js) are only imported where needed.
Node-only scripts (upload-content, seed-albums, sync-content) don’t affect client bundles.
12. Known Issues & Gotchas
postprocessing peer dependency warning
Warning about three version range vs 0.181.0.
Known and documented as safe; tested in this setup.
First texture load delay
1–2 seconds on first load from Supabase is normal.
Browsers cache thereafter.
WebGL / device quirks
Some low-end or locked-down devices may degrade or disable WebGL.
Reduced-motion and static-grid fallbacks catch most of these.
Ratings schema not in repo SQL
song_version_ratings and song_version_rating_stats are referenced in code but not defined in 
supabase-schema.sql
.
They must exist in your Supabase project and match the API expectations.
13. Troubleshooting
For more detail, see 
SETUP_GUIDE.md
, 
CONTENT_WORKFLOW.md
, 
DEPLOYMENT_CHECKLIST.md
.

13.1 Orbs not appearing
Check browser console for errors.
Verify 
.env.local
 Supabase URL and anon key.
Ensure albums have is_public = true.
Confirm covers / audio buckets exist and are public.
13.2 Audio not playing
Open audio_url in a new tab to confirm it’s publicly reachable.
Check console for CORS errors.
Confirm audio_url points to .../storage/v1/object/public/audio/....
Check file format (WAV/MP3/OGG/FLAC) support in the browser.
13.3 Images not loading
Confirm cover_url is correct and case-sensitive.
Check 
next.config.ts
 remotePatterns matches Supabase URL shape.
Ensure covers bucket is public and permissions are correct.
13.4 Ratings not saving
Confirm song_version_ratings table exists with expected columns.
Check RATING_IP_SALT is set (especially in production).
Inspect API responses / logs for Supabase errors.
13.5 Deployment issues
If production differs from local:
Verify env vars in Vercel.
Check Vercel build logs and browser console.
Confirm Supabase URL/keys match your local config.
14. Contact & Maintenance
This is for future maintainers of LokiTunes.

Key files before major changes
app/layout.tsx
 – root layout, fonts, global audio player, favicon.
app/page.tsx – home orb field entrypoint.
app/album/[slug]/page.tsx, app/album/[slug]/AlbumPage.tsx – album orchestration.
components/OrbField.tsx, components/VersionOrbField.tsx – 3D scenes.
components/BubbleOrb.tsx
, 
components/VersionOrb.tsx
 – core orb behavior.
lib/audio-store.ts
, components/AudioEngine.tsx, components/GlobalAudioPlayer.tsx – audio system.
lib/queries.ts, lib/supabase.ts, 
supabase-schema.sql
 – data layer and schema.
app/api/ratings/* – rating APIs.
Before shipping a major change
Run key parts of 
TESTING_CHECKLIST.md
 (visuals, physics, audio, fallbacks, mobile).
Run 
DEPLOYMENT_CHECKLIST.md
 for production sanity.
Verify orbs still behave fluidly across device tiers.
Confirm ratings and comments still read/write correctly.
Documentation expectations
When adding a new system (page, API, major component), add a short subsection here.
When changing schema, update 
supabase-schema.sql
 and the relevant architecture sections.
When altering content workflow, update 
CONTENT_WORKFLOW.md
 and keep this doc in sync.*