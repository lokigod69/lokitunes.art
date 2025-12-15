import { notFound } from 'next/navigation'
import { getAlbumBySlug } from '@/lib/queries'
import { AlbumPage } from './AlbumPage'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function Album({ params }: PageProps) {
  const { slug } = await params
  const album = await getAlbumBySlug(slug)

  if (!album) {
    notFound()
  }

  return <AlbumPage album={album} />
}
