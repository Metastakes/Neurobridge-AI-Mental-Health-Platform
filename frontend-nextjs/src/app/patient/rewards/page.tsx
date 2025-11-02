'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'
import type {
  RewardsMarketplace,
  RewardItem,
  RewardRedemption,
  RewardRedeemRequest,
} from '@/types'

const CATEGORY_ICONS: Record<string, string> = {
  VITAMINS: '💊',
  FITNESS_GEAR: '🏋️',
  HEALTHY_SNACKS: '🥗',
  WELLNESS_BOOKS: '📚',
  MEDITATION_APPS: '🧘',
  GYM_MEMBERSHIP: '🏃',
  MEAL_PREP: '🍱',
  OTHER: '🎁',
}

export default function RewardsMarketplacePage() {
  const [loading, setLoading] = useState(true)
  const [marketplace, setMarketplace] = useState<RewardsMarketplace | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [redeeming, setRedeeming] = useState(false)
  const [error, setError] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')

  useEffect(() => {
    loadMarketplace()
  }, [])

  const loadMarketplace = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getRewardsMarketplace()
      setMarketplace(data)
      setLoading(false)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load marketplace')
      setLoading(false)
    }
  }

  const handleRedeem = async () => {
    if (!selectedReward || !marketplace) return

    try {
      setRedeeming(true)
      setError('')

      const redeemData: RewardRedeemRequest = {
        reward_item_id: selectedReward.id,
        quantity,
      }

      await apiClient.redeemReward(redeemData)
      setSuccessMessage(`Successfully redeemed ${selectedReward.name}!`)
      setSelectedReward(null)
      setQuantity(1)

      // Reload marketplace to update points
      await loadMarketplace()

      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to redeem reward')
    } finally {
      setRedeeming(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rewards...</p>
        </div>
      </div>
    )
  }

  if (!marketplace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <span className="text-6xl">⚠️</span>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Error</h2>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  const categories = ['ALL', ...new Set(marketplace.all_rewards.map(r => r.category))]
  const filteredRewards = selectedCategory === 'ALL'
    ? marketplace.all_rewards
    : marketplace.all_rewards.filter(r => r.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-800 rounded-lg flex items-center">
            <span className="text-2xl mr-3">✓</span>
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Header with Points Balance */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Rewards Marketplace</h1>
                <p className="text-purple-100">Redeem your points for healthy rewards</p>
              </div>
              <div className="text-center bg-white bg-opacity-20 rounded-xl p-6 backdrop-blur-sm">
                <div className="text-5xl font-bold">{marketplace.patient_points.current_balance}</div>
                <div className="text-sm text-purple-100 mt-1">Points Available</div>
              </div>
            </div>

            {/* Points Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">{marketplace.patient_points.total_points_earned}</div>
                <div className="text-sm text-purple-100">Total Earned</div>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">{marketplace.patient_points.total_points_spent}</div>
                <div className="text-sm text-purple-100">Total Spent</div>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">{marketplace.patient_points.total_redemptions}</div>
                <div className="text-sm text-purple-100">Redemptions</div>
              </div>
            </div>
          </div>
        </div>

        {/* How to Earn Points */}
        <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            <span className="mr-2">💡</span>
            How to Earn Points
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {marketplace.points_earning_guide.available_tasks.map((task) => (
              <div
                key={task.task}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 text-center border-2 border-indigo-100"
              >
                <span className="text-3xl">{task.icon}</span>
                <div className="mt-2 text-2xl font-bold text-indigo-600">+{task.points}</div>
                <div className="text-xs text-gray-600 mt-1">{task.task}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Rewards */}
        {marketplace.featured_rewards.length > 0 && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              <span className="mr-2">⭐</span>
              Featured Rewards
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {marketplace.featured_rewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  currentBalance={marketplace.patient_points.current_balance}
                  onSelect={() => setSelectedReward(reward)}
                  featured
                />
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {category === 'ALL' ? 'All Rewards' : `${CATEGORY_ICONS[category] || '🎁'} ${category.replace('_', ' ')}`}
              </button>
            ))}
          </div>
        </div>

        {/* All Rewards */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            <span className="mr-2">🎁</span>
            {selectedCategory === 'ALL' ? 'All Rewards' : selectedCategory.replace('_', ' ')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredRewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                currentBalance={marketplace.patient_points.current_balance}
                onSelect={() => setSelectedReward(reward)}
              />
            ))}
          </div>
        </div>

        {/* Recent Redemptions */}
        {marketplace.recent_redemptions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              <span className="mr-2">📦</span>
              Recent Redemptions
            </h2>
            <div className="space-y-3">
              {marketplace.recent_redemptions.map((redemption) => (
                <div
                  key={redemption.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-semibold text-gray-900">{redemption.reward_name}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(redemption.redeemed_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-purple-600">-{redemption.points_spent} pts</div>
                    <div className="text-sm text-gray-600">{redemption.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Redemption Modal */}
      {selectedReward && (
        <RedemptionModal
          reward={selectedReward}
          currentBalance={marketplace.patient_points.current_balance}
          quantity={quantity}
          setQuantity={setQuantity}
          onRedeem={handleRedeem}
          onClose={() => {
            setSelectedReward(null)
            setQuantity(1)
            setError('')
          }}
          redeeming={redeeming}
          error={error}
        />
      )}
    </div>
  )
}

function RewardCard({
  reward,
  currentBalance,
  onSelect,
  featured = false,
}: {
  reward: RewardItem
  currentBalance: number
  onSelect: () => void
  featured?: boolean
}) {
  const canAfford = currentBalance >= reward.points_cost
  const categoryIcon = CATEGORY_ICONS[reward.category] || '🎁'

  return (
    <div
      className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-2xl hover:scale-105 cursor-pointer ${
        featured ? 'border-2 border-yellow-400' : ''
      }`}
      onClick={onSelect}
    >
      {featured && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-center py-1 text-xs font-bold">
          ⭐ FEATURED
        </div>
      )}

      <div className="p-6">
        <div className="text-5xl text-center mb-4">{categoryIcon}</div>

        {reward.is_partner && reward.brand_name && (
          <div className="text-center mb-2">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              Partnership with {reward.brand_name}
            </span>
          </div>
        )}

        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">{reward.name}</h3>
        <p className="text-sm text-gray-600 text-center mb-4 line-clamp-2">{reward.description}</p>

        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600">{reward.points_cost}</div>
          <div className="text-sm text-gray-500">points</div>
        </div>

        <button
          className={`mt-4 w-full py-3 rounded-lg font-semibold transition-all ${
            canAfford
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!canAfford}
        >
          {canAfford ? 'Redeem Now' : 'Insufficient Points'}
        </button>
      </div>
    </div>
  )
}

function RedemptionModal({
  reward,
  currentBalance,
  quantity,
  setQuantity,
  onRedeem,
  onClose,
  redeeming,
  error,
}: {
  reward: RewardItem
  currentBalance: number
  quantity: number
  setQuantity: (q: number) => void
  onRedeem: () => void
  onClose: () => void
  redeeming: boolean
  error: string
}) {
  const totalCost = reward.points_cost * quantity
  const canAfford = currentBalance >= totalCost
  const maxQuantity = reward.max_per_user || 10

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <span className="text-6xl">{CATEGORY_ICONS[reward.category] || '🎁'}</span>
          <h2 className="text-2xl font-bold text-gray-900 mt-4">{reward.name}</h2>
          <p className="text-gray-600 mt-2">{reward.description}</p>

          {reward.is_partner && reward.brand_name && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Partnership Reward:</span> {reward.brand_name}
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Quantity Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              disabled={quantity <= 1}
            >
              -
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(maxQuantity, parseInt(e.target.value) || 1)))}
              className="w-20 text-center border-2 border-gray-300 rounded-lg py-2"
              min="1"
              max={maxQuantity}
            />
            <button
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              className="w-10 h-10 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              disabled={quantity >= maxQuantity}
            >
              +
            </button>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-700">Cost per item:</span>
            <span className="font-semibold">{reward.points_cost} points</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-700">Quantity:</span>
            <span className="font-semibold">{quantity}</span>
          </div>
          <div className="border-t border-gray-300 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-bold text-gray-900">Total Cost:</span>
              <span className="font-bold text-purple-600">{totalCost} points</span>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-gray-600">Balance after:</span>
            <span className={canAfford ? 'text-gray-900' : 'text-red-600'}>
              {currentBalance - totalCost} points
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            disabled={redeeming}
          >
            Cancel
          </button>
          <button
            onClick={onRedeem}
            disabled={!canAfford || redeeming}
            className={`flex-1 py-3 rounded-lg font-semibold transition ${
              canAfford && !redeeming
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {redeeming ? 'Redeeming...' : 'Confirm Redemption'}
          </button>
        </div>
      </div>
    </div>
  )
}
