/**
 * INNOVATION: Crisis Resources & Safety Planning
 * Immediate access to crisis support and emergency resources
 */

import React, { useState } from 'react';

interface Props {
  patientId: string;
  apiBaseUrl?: string;
  onSafetyCheckRequested?: () => void;
}

export default function CrisisResources({ patientId, apiBaseUrl = 'http://localhost:3000', onSafetyCheckRequested }: Props) {
  const [requestingSafetyCheck, setRequestingSafetyCheck] = useState(false);
  const [safetyMessage, setSafetyMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const requestSafetyCheck = async () => {
    if (!confirm('This will immediately alert your provider. Do you want to continue?')) {
      return;
    }

    setRequestingSafetyCheck(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiBaseUrl}/crisis/safety-check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          message: safetyMessage || 'Immediate safety check requested',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to request safety check');
      }

      setShowSuccessMessage(true);
      setSafetyMessage('');
      if (onSafetyCheckRequested) onSafetyCheckRequested();

      setTimeout(() => setShowSuccessMessage(false), 5000);
    } catch (error) {
      console.error('Failed to request safety check:', error);
      alert('Failed to send request. Please call 988 directly.');
    } finally {
      setRequestingSafetyCheck(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Emergency Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="text-6xl mb-4">🚨</div>
          <h1 className="text-4xl font-bold mb-2">Crisis Support</h1>
          <p className="text-xl opacity-90">You are not alone. Help is available 24/7.</p>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-6 animate-pulse">
            <h3 className="text-green-800 font-bold text-lg mb-2">✓ Provider Notified</h3>
            <p className="text-green-700">
              Your provider has been alerted and will reach out soon. If you need immediate help, please call 988.
            </p>
          </div>
        )}

        {/* Immediate Help */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="text-red-500">☎️</span>
            Immediate Help
          </h2>

          <div className="space-y-4">
            {/* 988 Lifeline */}
            <a
              href="tel:988"
              className="block bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl p-6 hover:shadow-2xl transition-all transform hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Call 988</h3>
                  <p className="opacity-90">Suicide & Crisis Lifeline (24/7)</p>
                </div>
                <div className="text-5xl">📞</div>
              </div>
            </a>

            {/* Crisis Text Line */}
            <a
              href="sms:741741&body=HELLO"
              className="block bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl p-6 hover:shadow-2xl transition-all transform hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Text "HELLO" to 741741</h3>
                  <p className="opacity-90">Crisis Text Line (24/7)</p>
                </div>
                <div className="text-5xl">💬</div>
              </div>
            </a>

            {/* 911 */}
            <a
              href="tel:911"
              className="block bg-gray-800 text-white rounded-2xl p-6 hover:shadow-2xl transition-all transform hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Call 911</h3>
                  <p className="opacity-90">For life-threatening emergencies</p>
                </div>
                <div className="text-5xl">🚑</div>
              </div>
            </a>
          </div>
        </div>

        {/* Request Provider Safety Check */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
            <span className="text-blue-500">👨‍⚕️</span>
            Contact Your Provider
          </h2>

          <p className="text-gray-700 mb-4">
            Send an immediate alert to your provider for a safety check. They will be notified right away.
          </p>

          <textarea
            value={safetyMessage}
            onChange={(e) => setSafetyMessage(e.target.value)}
            placeholder="Optional: Add a message for your provider..."
            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />

          <button
            onClick={requestSafetyCheck}
            disabled={requestingSafetyCheck}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {requestingSafetyCheck ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Sending Alert...
              </span>
            ) : (
              'Request Immediate Safety Check'
            )}
          </button>
        </div>

        {/* Additional Resources */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Additional Resources</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-gray-200 rounded-xl p-4">
              <h3 className="font-bold text-gray-800 mb-2">SAMHSA Helpline</h3>
              <a href="tel:18006624357" className="text-blue-600 font-semibold">
                1-800-662-4357
              </a>
              <p className="text-sm text-gray-600 mt-1">
                Mental health & substance abuse treatment referral (24/7)
              </p>
            </div>

            <div className="border-2 border-gray-200 rounded-xl p-4">
              <h3 className="font-bold text-gray-800 mb-2">Veterans Crisis Line</h3>
              <a href="tel:988" className="text-blue-600 font-semibold">
                Call 988, Press 1
              </a>
              <p className="text-sm text-gray-600 mt-1">
                Or text 838255 (24/7 support for veterans)
              </p>
            </div>

            <div className="border-2 border-gray-200 rounded-xl p-4">
              <h3 className="font-bold text-gray-800 mb-2">Trevor Project</h3>
              <a href="tel:18664887386" className="text-blue-600 font-semibold">
                1-866-488-7386
              </a>
              <p className="text-sm text-gray-600 mt-1">
                LGBTQ+ youth crisis support (24/7)
              </p>
            </div>

            <div className="border-2 border-gray-200 rounded-xl p-4">
              <h3 className="font-bold text-gray-800 mb-2">Trans Lifeline</h3>
              <a href="tel:18775658860" className="text-blue-600 font-semibold">
                1-877-565-8860
              </a>
              <p className="text-sm text-gray-600 mt-1">
                Transgender peer support hotline
              </p>
            </div>
          </div>
        </div>

        {/* Safety Planning */}
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Safety Planning Steps</h2>

          <ol className="space-y-3">
            {[
              'Recognize your personal warning signs',
              'Use internal coping strategies (breathing, mindfulness)',
              'Contact people who can provide support',
              'Contact professionals or crisis agencies',
              'Reduce access to lethal means',
              'Remind yourself of reasons for living',
            ].map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-gray-800 font-medium pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Important Reminder */}
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-6 text-center">
          <p className="text-lg font-semibold text-yellow-800 mb-2">
            You matter. Your life has value.
          </p>
          <p className="text-yellow-700">
            If you're in crisis, please reach out for help. Recovery is possible, and you don't have to face this alone.
          </p>
        </div>
      </div>
    </div>
  );
}
