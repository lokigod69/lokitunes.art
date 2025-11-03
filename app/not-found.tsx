import Link from 'next/link'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 404 */}
        <div className="space-y-4">
          <h1 className="text-9xl font-bold text-voltage">404</h1>
          <h2 className="text-3xl font-bold text-bone">
            Lost in the Void
          </h2>
          <p className="text-bone/70 text-lg">
            This frequency doesn't exist in our sonic landscape.
          </p>
        </div>

        {/* Back to home */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-voltage hover:bg-voltage/80 text-void rounded-full transition-colors font-medium"
        >
          <Home className="w-5 h-5" />
          Return to Orb Field
        </Link>
      </div>
    </div>
  )
}
