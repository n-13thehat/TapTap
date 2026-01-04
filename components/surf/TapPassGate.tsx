"use client";

import { useState } from 'react';
import { SurfError } from '@/lib/surf/types';
import { useTapPass } from '@/hooks/useSurf';
import { 
  Crown, 
  Lock, 
  Zap, 
  Star, 
  Check, 
  X,
  Sparkles,
  Infinity,
  Shield
} from 'lucide-react';

interface TapPassGateProps {
  error: SurfError;
  onUpgrade: () => void;
}

export default function TapPassGate({ error, onUpgrade }: TapPassGateProps) {
  const [selectedTier, setSelectedTier] = useState<'basic' | 'premium' | 'vip'>('basic');
  const { upgradeTapPass } = useTapPass();

  const tiers = [
    {
      id: 'basic' as const,
      name: 'TapPass Basic',
      price: '$4.99/month',
      color: 'blue',
      icon: <Zap size={24} />,
      features: [
        'Unlimited surfing',
        'Ad-free experience',
        'Basic filters',
        'Save unlimited tracks',
        'Priority support',
      ],
      limits: {
        surf: 'Unlimited',
        save: 'Unlimited',
        feeds: '4 feeds',
      },
    },
    {
      id: 'premium' as const,
      name: 'TapPass Premium',
      price: '$9.99/month',
      color: 'purple',
      icon: <Star size={24} />,
      features: [
        'Everything in Basic',
        'Premium curated feeds',
        'Advanced filters',
        'Early access features',
        'Playlist export',
        'Analytics dashboard',
      ],
      limits: {
        surf: 'Unlimited',
        save: 'Unlimited',
        feeds: '8 feeds',
      },
      popular: true,
    },
    {
      id: 'vip' as const,
      name: 'TapPass VIP',
      price: '$19.99/month',
      color: 'yellow',
      icon: <Crown size={24} />,
      features: [
        'Everything in Premium',
        'Beta access',
        'Shadow track creation',
        'API access',
        'Custom feeds',
        'White-glove support',
        'Exclusive events',
      ],
      limits: {
        surf: 'Unlimited',
        save: 'Unlimited',
        feeds: 'All feeds',
      },
    },
  ];

  const handleUpgrade = async () => {
    try {
      await upgradeTapPass(selectedTier);
      onUpgrade();
    } catch (error) {
      console.error('Failed to upgrade TapPass:', error);
    }
  };

  const getColorClasses = (color: string, selected: boolean) => {
    const colors = {
      blue: selected 
        ? 'border-blue-500 bg-blue-500/20' 
        : 'border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20',
      purple: selected 
        ? 'border-purple-500 bg-purple-500/20' 
        : 'border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20',
      yellow: selected 
        ? 'border-yellow-500 bg-yellow-500/20' 
        : 'border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20',
    };
    return colors[color as keyof typeof colors];
  };

  const getIconColor = (color: string) => {
    const colors = {
      blue: 'text-blue-400',
      purple: 'text-purple-400',
      yellow: 'text-yellow-400',
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Lock size={32} className="text-yellow-400" />
            <Crown size={32} className="text-yellow-400" />
          </div>
          
          <h1 className="text-3xl font-bold mb-2">TapPass Required</h1>
          <p className="text-white/60 text-lg">
            {error.type === 'tappass_required' 
              ? 'This content requires a TapPass subscription'
              : 'Upgrade to unlock premium features'
            }
          </p>
        </div>

        {/* Error Details */}
        <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} className="text-red-400" />
            <span className="font-medium text-red-300">Access Restricted</span>
          </div>
          <p className="text-red-200 text-sm">{error.message}</p>
        </div>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative border rounded-2xl p-6 cursor-pointer transition-all ${
                getColorClasses(tier.color, selectedTier === tier.id)
              }`}
              onClick={() => setSelectedTier(tier.id)}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-6">
                <div className={`inline-flex p-3 rounded-full mb-3 ${getIconColor(tier.color)}`}>
                  {tier.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{tier.name}</h3>
                <div className="text-2xl font-bold text-white">{tier.price}</div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {tier.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check size={16} className="text-green-400 flex-shrink-0" />
                    <span className="text-white/80 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Limits */}
              <div className="border-t border-white/10 pt-4">
                <div className="space-y-2">
                  {Object.entries(tier.limits).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-white/60 capitalize">{key}:</span>
                      <span className="text-white/80">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selection Indicator */}
              {selectedTier === tier.id && (
                <div className="absolute top-4 right-4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    tier.color === 'blue' ? 'bg-blue-500' :
                    tier.color === 'purple' ? 'bg-purple-500' :
                    'bg-yellow-500'
                  }`}>
                    <Check size={14} className="text-white" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Benefits Highlight */}
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-600/30 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-purple-400" />
            Why Upgrade to TapPass?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Infinity size={20} className="text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-white">Unlimited Discovery</h4>
                <p className="text-white/80 text-sm">
                  Surf without limits and discover endless new music
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Crown size={20} className="text-yellow-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-white">Premium Content</h4>
                <p className="text-white/80 text-sm">
                  Access exclusive feeds and curated playlists
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Zap size={20} className="text-green-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-white">Advanced Features</h4>
                <p className="text-white/80 text-sm">
                  Beta access, shadow tracks, and cutting-edge tools
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Shield size={20} className="text-purple-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-white">Ad-Free Experience</h4>
                <p className="text-white/80 text-sm">
                  Enjoy uninterrupted music discovery
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={16} />
            Go Back
          </button>
          
          <button
            onClick={handleUpgrade}
            className={`flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-colors ${
              selectedTier === 'basic' ? 'bg-blue-600 hover:bg-blue-700' :
              selectedTier === 'premium' ? 'bg-purple-600 hover:bg-purple-700' :
              'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            <Crown size={16} />
            Upgrade to {tiers.find(t => t.id === selectedTier)?.name}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/60 text-sm">
          <p>30-day money-back guarantee • Cancel anytime • Secure payment</p>
        </div>
      </div>
    </div>
  );
}
