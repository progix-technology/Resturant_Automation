import React, { useState } from 'react';
import { Star, ExternalLink, MessageSquare, CheckCircle2, Heart, Sparkles } from 'lucide-react';
import { Button } from './Button';

export const GoogleRatingCard = ({
  customerName = 'Valued Guest',
  restaurantName = 'The Spice Garden',
  googleReviewUrl = 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
  onClose,
  isModal = false,
}) => {
  const [selectedRating, setSelectedRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submittedReview, setSubmittedReview] = useState(false);
  const [selectedTags, setSelectedTags] = useState(['Delicious Food', 'Fast Service']);

  const feedbackTags = [
    'Delicious Food',
    'Fast Service',
    'Great Ambiance',
    'Friendly Staff',
    'Clean & Hygienic',
  ];

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleOpenGoogle = () => {
    setSubmittedReview(true);
    window.open(googleReviewUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareWhatsApp = () => {
    const text = `⭐ I just had a wonderful dining experience at ${restaurantName}! The food was delicious and service was super fast. Highly recommended! 🍽️✨ Check it out here: ${googleReviewUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const content = (
    <div className="bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50/50 rounded-3xl p-5 sm:p-6 border-2 border-amber-300 shadow-xl text-center space-y-4 relative overflow-hidden animate-slide-up">
      {/* Decorative background blur */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-28 h-28 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-28 h-28 bg-orange-400/20 rounded-full blur-2xl pointer-events-none" />

      {/* Google Badge Header */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-amber-200 shadow-xs">
        {/* Google G multi-color icon */}
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <span className="text-xs font-bold text-slate-800 tracking-tight">Google Rating & Review</span>
      </div>

      {/* Main Title */}
      <div>
        <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
          How was your meal, {customerName}?
        </h3>
        <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
          Your order has been served hot! If you enjoyed our food and hospitality, please take 10 seconds to share your review on Google.
        </p>
      </div>

      {/* Interactive 5 Star Selector */}
      <div className="py-1">
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = (hoveredRating || selectedRating) >= star;
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setSelectedRating(star)}
                className="transition-transform transform hover:scale-125 active:scale-95 focus:outline-none p-1 cursor-pointer"
                title={`${star} Star`}
              >
                <Star
                  className={`w-8 h-8 sm:w-9 sm:h-9 ${
                    isFilled
                      ? 'fill-amber-400 text-amber-500 drop-shadow-sm'
                      : 'fill-slate-200 text-slate-300'
                  } transition-colors`}
                />
              </button>
            );
          })}
        </div>
        <p className="text-xs font-extrabold text-amber-800 mt-1.5">
          {selectedRating === 5 && '🌟 Exceptional! 5/5 Stars'}
          {selectedRating === 4 && '✨ Great Experience! 4/5 Stars'}
          {selectedRating === 3 && '👍 Good Food! 3/5 Stars'}
          {selectedRating <= 2 && '🙏 Thank you for your feedback!'}
        </p>
      </div>

      {/* Quick feedback tags */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
        {feedbackTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                isSelected
                  ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* CTA Button to Google Reviews */}
      <div className="space-y-2 pt-2">
        <Button
          onClick={handleOpenGoogle}
          variant="primary"
          size="lg"
          fullWidth
          icon={ExternalLink}
          className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold shadow-lg shadow-amber-600/30 text-sm py-3"
        >
          {submittedReview ? 'Review Submitted on Google!' : 'Post Review on Google Maps'}
        </Button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex-1 py-2 px-3 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Share via WhatsApp</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
        <div className="w-full max-w-md">{content}</div>
      </div>
    );
  }

  return content;
};
