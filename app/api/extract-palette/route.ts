import { NextRequest, NextResponse } from 'next/server'
import { extractPalette } from '@/lib/colors'

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    const palette = await extractPalette(imageUrl)

    if (!palette) {
      return NextResponse.json(
        { error: 'Failed to extract palette' },
        { status: 500 }
      )
    }

    return NextResponse.json(palette)
  } catch (error) {
    console.error('Error extracting palette:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
