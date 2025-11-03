import Link from 'next/link'
import { ArrowLeft, Heart } from 'lucide-react'

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-bone/70 hover:text-bone transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to orb field</span>
        </Link>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-ember/20 flex items-center justify-center">
            <Heart className="w-12 h-12 text-ember" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-bone">
            Support Coming Soon
          </h1>
          <p className="text-bone/70 text-lg max-w-xl mx-auto">
            Thank you for wanting to support this sonic landscape. 
            Donation options will be available here soon.
          </p>
        </div>

        {/* Placeholder message */}
        <div className="bg-void/50 border border-bone/10 rounded-lg p-8">
          <p className="text-bone/60">
            In the meantime, the best way to support is to share this space 
            with others who might resonate with the music.
          </p>
        </div>
      </div>
    </div>
  )
}
