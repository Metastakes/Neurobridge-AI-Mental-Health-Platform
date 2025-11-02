import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary-600">NeuroBridge</h1>
            <div className="space-x-4">
              <Link href="/auth/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-5xl font-bold text-gray-900">
            Professional Mental Health Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            HIPAA-compliant telepsychiatry platform connecting patients with licensed mental health
            professionals. All GUARANTEES enforced for your safety and security.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="text-primary-600 text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">HIPAA Compliant</h3>
              <p className="text-gray-600">
                Your health information is protected with industry-leading security and encryption
              </p>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="text-primary-600 text-4xl mb-4">👨‍⚕️</div>
              <h3 className="text-xl font-semibold mb-2">Licensed Professionals</h3>
              <p className="text-gray-600">
                Connect with therapists, psychiatric nurse practitioners, and psychiatrists
              </p>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="text-primary-600 text-4xl mb-4">💳</div>
              <h3 className="text-xl font-semibold mb-2">Transparent Billing</h3>
              <p className="text-gray-600">
                Clear pricing with cash and insurance options. No hidden fees.
              </p>
            </div>
          </div>

          <div className="mt-12">
            <Link href="/auth/register">
              <Button size="lg" className="px-8">Start Your Journey Today</Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-gray-50 border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600 text-sm">
            © 2025 NeuroBridge. All rights reserved. HIPAA-compliant mental health platform.
          </p>
        </div>
      </footer>
    </div>
  )
}
