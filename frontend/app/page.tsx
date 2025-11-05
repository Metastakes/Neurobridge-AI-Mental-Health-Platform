import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            NeuroBridge
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
            AI Clinical Assistant for PMHNP Students
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Real-time AI guidance during telehealth sessions
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🎙️</div>
            <h3 className="text-lg font-semibold mb-2">Live Transcription</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Real-time transcription of your telehealth sessions
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">💡</div>
            <h3 className="text-lg font-semibold mb-2">AI Suggestions</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Get next-question suggestions as you talk
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">Safety Alerts</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Critical reminders for SI/HI screening
            </p>
          </div>
        </div>

        <div className="text-center space-x-4">
          <Link
            href="/signup"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Log In
          </Link>
        </div>

        <div className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>🔒 Zero PHI storage • HIPAA-aware • Built for students</p>
        </div>
      </div>
    </div>
  );
}
