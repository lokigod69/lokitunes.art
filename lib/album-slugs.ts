export function normalizeAlbumRouteSlug(slug: string): string {
  let current = slug

  for (let index = 0; index < 2; index += 1) {
    try {
      const decoded = decodeURIComponent(current)
      if (decoded === current) break
      current = decoded
    } catch {
      break
    }
  }

  return current
}

export function getAlbumSlugCandidates(routeSlug: string): string[] {
  const normalized = normalizeAlbumRouteSlug(routeSlug)
  return Array.from(new Set([normalized, routeSlug]))
}

export function getAlbumHref(slug: string): string {
  return `/album/${encodeURIComponent(normalizeAlbumRouteSlug(slug))}`
}
