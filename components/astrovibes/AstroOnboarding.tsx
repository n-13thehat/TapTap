"use client";

import { useState } from 'react';
import { Star, Calendar, MapPin, Clock, ChevronRight, Sparkles } from 'lucide-react';

interface AstroOnboardingProps {
  onComplete?: (profile: any) => void;
  onCancel?: () => void;
}

export default function AstroOnboarding({ onComplete }: AstroOnboardingProps) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<{
    birthDate: string;
    birthTime: string;
    birthLocation: string;
    timezone: string;
    musicPreferences: string[];
    astroInterest: string;
  }>({
    birthDate: '',
    birthTime: '',
    birthLocation: '',
    timezone: '',
    musicPreferences: [],
    astroInterest: 'curious'
  });

  const steps = [
    { id: 1, title: 'Birth Information', description: 'Your cosmic blueprint' },
    { id: 2, title: 'Music Preferences', description: 'Your sonic preferences' },
    { id: 3, title: 'Astro Interest', description: 'Your cosmic curiosity level' }
  ];

  const musicGenres = [
    'Electronic', 'Hip Hop', 'Pop', 'Rock', 'Jazz', 'Classical', 
    'R&B', 'Country', 'Folk', 'Reggae', 'Metal', 'Indie'
  ];

  const astroLevels = [
    { id: 'curious', name: 'Curious', description: 'Just exploring astrology' },
    { id: 'interested', name: 'Interested', description: 'Know some basics' },
    { id: 'enthusiast', name: 'Enthusiast', description: 'Regular astrology follower' },
    { id: 'expert', name: 'Expert', description: 'Deep astrological knowledge' }
  ];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete && onComplete(profile);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return profile.birthDate && profile.birthTime && profile.birthLocation;
      case 2:
        return profile.musicPreferences.length > 0;
      case 3:
        return profile.astroInterest;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((s, index) => (
            <div key={s.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= s.id ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/60'
              }`}>
                {step > s.id ? '✓' : s.id}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-2 ${
                  step > s.id ? 'bg-purple-600' : 'bg-white/10'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white">{steps[step - 1].title}</h2>
          <p className="text-white/60">{steps[step - 1].description}</p>
        </div>
      </div>

      <div className="bg-white/5 rounded-lg p-8">
        {/* Step 1: Birth Information */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Star size={48} className="mx-auto mb-4 text-purple-400" />
              <h3 className="text-lg font-semibold text-white mb-2">Your Cosmic Blueprint</h3>
              <p className="text-white/80">
                We need your birth details to create your personalized astro-musical profile
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <Calendar size={16} className="inline mr-2" />
                  Birth Date
                </label>
                <input
                  type="date"
                  value={profile.birthDate}
                  onChange={(e) => setProfile(prev => ({ ...prev, birthDate: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <Clock size={16} className="inline mr-2" />
                  Birth Time
                </label>
                <input
                  type="time"
                  value={profile.birthTime}
                  onChange={(e) => setProfile(prev => ({ ...prev, birthTime: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <MapPin size={16} className="inline mr-2" />
                Birth Location
              </label>
              <input
                type="text"
                value={profile.birthLocation}
                onChange={(e) => setProfile(prev => ({ ...prev, birthLocation: e.target.value }))}
                placeholder="City, State/Country"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40"
              />
            </div>

            <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4">
              <h4 className="text-blue-400 font-medium mb-2">Why do we need this?</h4>
              <p className="text-white/80 text-sm">
                Your birth chart is calculated from your exact birth time and location. 
                This creates your unique astrological profile that influences your music recommendations.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Music Preferences */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Sparkles size={48} className="mx-auto mb-4 text-blue-400" />
              <h3 className="text-lg font-semibold text-white mb-2">Your Musical Universe</h3>
              <p className="text-white/80">
                Select the genres that resonate with your soul
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {musicGenres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => {
                    const isSelected = profile.musicPreferences.includes(genre);
                    setProfile(prev => ({
                      ...prev,
                      musicPreferences: isSelected
                        ? prev.musicPreferences.filter(g => g !== genre)
                        : [...prev.musicPreferences, genre]
                    }));
                  }}
                  className={`p-3 rounded-lg text-sm transition-all ${
                    profile.musicPreferences.includes(genre)
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>

            <div className="text-center text-white/60 text-sm">
              Selected: {profile.musicPreferences.length} genres
            </div>
          </div>
        )}

        {/* Step 3: Astro Interest Level */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Star size={48} className="mx-auto mb-4 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white mb-2">Your Cosmic Journey</h3>
              <p className="text-white/80">
                How deep is your connection to the stars?
              </p>
            </div>

            <div className="space-y-4">
              {astroLevels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setProfile(prev => ({ ...prev, astroInterest: level.id }))}
                  className={`w-full p-4 rounded-lg text-left transition-all ${
                    profile.astroInterest === level.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <div className="font-medium mb-1">{level.name}</div>
                  <div className="text-sm opacity-80">{level.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={step === 1}
            className="px-6 py-2 rounded-lg text-white/60 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {step === 3 ? 'Complete Setup' : 'Next'}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
