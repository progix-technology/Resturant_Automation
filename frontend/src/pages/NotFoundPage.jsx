import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Home } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-warm-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-warm-200 shadow-card text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-warm-200 flex items-center justify-center mx-auto text-charcoal-500">
          <UtensilsCrossed className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-black text-charcoal-900 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-500 leading-relaxed">
          The link or QR code you followed does not correspond to an active menu.
        </p>

        <div className="pt-2">
          <Button
            onClick={() => navigate('/menu/spice-garden')}
            variant="primary"
            fullWidth
            icon={Home}
          >
            Go to Spice Garden Menu
          </Button>
        </div>
      </div>
    </div>
  );
};
