import React, { useState } from 'react';
// Fix: Add file extensions to imports to resolve module errors.
import { Star } from '../Icons.tsx';
import { PatientView } from '../../types.ts';

interface PatientReviewProps {
    setActiveView: (view: PatientView) => void;
    setPoints: React.Dispatch<React.SetStateAction<number>>;
    setReviews: React.Dispatch<React.SetStateAction<number>>;
}

const PatientReview: React.FC<PatientReviewProps> = ({ setActiveView, setPoints, setReviews }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const feedbackTags = ["Good Listener", "Helpful Advice", "Empathetic", "On Time", "Actionable Plan"];

    const handleTagClick = (tag: string) => {
        setSelectedTags(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            alert("Please select a rating.");
            return;
        }
        setPoints(p => p + 50);
        setReviews(r => r + 1);
        alert("Thank you for your feedback! You've earned 50 points.");
        setActiveView('dashboard');
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 space-y-6">
                <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800">Rate Your Session</h3>
                    <p className="text-gray-600">with Dr. Evelyn Reed</p>
                </div>

                {/* Star Rating */}
                <div className="flex justify-center items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={`w-10 h-10 cursor-pointer transition-all duration-200 transform
                                ${star <= (hoverRating || rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                                ${star === hoverRating ? 'scale-110' : ''}
                            `}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                        />
                    ))}
                </div>

                {/* Feedback Tags */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-center">What went well?</label>
                    <div className="flex flex-wrap justify-center gap-2">
                        {feedbackTags.map(tag => (
                            <button
                                type="button"
                                key={tag}
                                onClick={() => handleTagClick(tag)}
                                className={`px-3 py-1.5 text-sm font-semibold rounded-full border-2 transition-colors ${
                                    selectedTags.includes(tag)
                                    ? 'bg-teal-500 text-white border-teal-500'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400'
                                }`}
                            >
                               {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Comment Box */}
                <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1 text-center">
                        Add a comment (optional)
                    </label>
                    <textarea
                        id="comment"
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Share your thoughts..."
                    ></textarea>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                    Submit Review (+50 pts)
                </button>
            </form>
        </div>
    );
};

export default PatientReview;
