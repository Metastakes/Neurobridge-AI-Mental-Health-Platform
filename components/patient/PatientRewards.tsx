// Fix: Create the PatientRewards component
import React, { useState } from 'react';
// Fix: Add file extension to import to resolve module error.
import { Gift, Mail, X } from '../Icons.tsx';
import { Reward } from '../../types.ts';

interface PatientRewardsProps {
  points: number;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
}

const rewards: Reward[] = [
    { id: 'gc_10', name: '$10 Wellness Gift Card (Amazon)', cost: 1000, type: 'gift_card', icon: '🎁' },
    { id: 'hs_1m', name: '1-Month Headspace Subscription', cost: 1500, type: 'subscription', icon: '🧘' },
    { id: 'gc_25', name: '$25 Wellness Gift Card (Amazon)', cost: 2500, type: 'gift_card', icon: '🎁' },
];


const RedemptionModal: React.FC<{
    reward: Reward;
    onClose: () => void;
    onConfirm: (email: string) => void;
}> = ({ reward, onClose, onConfirm }) => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.includes('@')) {
            alert('Please enter a valid email.');
            return;
        }
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            onConfirm(email);
            setIsSuccess(true);
             setTimeout(onClose, 2000);
        }, 1000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Redeem Reward</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X /></button>
                </div>
                {isSuccess ? (
                    <div className="text-center py-8">
                        <div className="text-5xl mb-3">✅</div>
                        <h3 className="text-xl font-bold text-gray-800">Success!</h3>
                        <p className="text-gray-600 mt-2">Your reward has been sent to <span className="font-semibold">{email}</span>.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <p className="text-gray-700 mb-2">You are redeeming: <span className="font-bold">{reward.name}</span> for {reward.cost} points.</p>
                        <p className="text-sm text-gray-600 mb-4">Please enter your email address to receive your gift card code.</p>
                        
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your.email@example.com"
                                required
                                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full mt-6 bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 disabled:bg-gray-400"
                        >
                            {isSubmitting ? 'Sending...' : `Confirm & Spend ${reward.cost} pts`}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};


const PatientRewards: React.FC<PatientRewardsProps> = ({ points, setPoints }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    
    const handleRedeemClick = (reward: Reward) => {
        if (reward.type === 'gift_card') {
            setSelectedReward(reward);
            setIsModalOpen(true);
        } else {
            // Handle other reward types directly
            setPoints(p => p - reward.cost);
            alert(`You've successfully redeemed the ${reward.name}!`);
        }
    };
    
    const handleConfirmRedemption = () => {
        if (selectedReward) {
            setPoints(p => p - selectedReward.cost);
        }
    };

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
        {isModalOpen && selectedReward && (
            <RedemptionModal
                reward={selectedReward}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmRedemption}
            />
        )}
      <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200 text-center">
        <Gift className="w-12 h-12 mx-auto text-yellow-500 mb-2" />
        <h3 className="text-lg font-bold text-gray-800">Your Points Balance</h3>
        <p className="text-4xl font-bold text-teal-600">{points}</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Redeem Your Points</h3>
        {rewards.map((reward) => (
          <div
            key={reward.id}
            className={`bg-white rounded-2xl shadow-lg p-4 border flex items-center justify-between ${points < reward.cost ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">{reward.icon}</div>
              <div>
                <p className="font-semibold text-gray-800">{reward.name}</p>
                <p className="text-sm font-bold text-teal-500">{reward.cost} pts</p>
              </div>
            </div>
            <button
              onClick={() => handleRedeemClick(reward)}
              disabled={points < reward.cost}
              className="bg-teal-500 text-white font-semibold px-4 py-2 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-teal-600 transition-colors"
            >
              Redeem
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientRewards;
