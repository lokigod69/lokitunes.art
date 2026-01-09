import { notFound } from 'next/navigation'
import { getAlbumBySlug } from '@/lib/queries'
import { AlbumPage } from './AlbumPage'
import { devLog } from '@/lib/debug'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function Album({ params }: PageProps) {
  const { slug } = await params
  const album = await getAlbumBySlug(slug)

  if (!album) {
    notFound()
  }

  // 🔥🔥🔥 DEBUG: Log exact palette data on server
  devLog('🔥🔥🔥 SERVER: Album data for', slug, ':', {
    palette: album.palette,
    paletteType: typeof album.palette,
    dominantColor: album.palette?.dominant,
    dominantLength: album.palette?.dominant?.length,
    accent1Color: album.palette?.accent1,
    accent1Length: album.palette?.accent1?.length,
    accent2Color: album.palette?.accent2,
    accent2Length: album.palette?.accent2?.length,
  })

  return <AlbumPage album={album} />
}
