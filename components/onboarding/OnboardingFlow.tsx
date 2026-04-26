"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to TapTap Matrix',
    description: 'Your music platform powered by AI agents',
    content: (
      <div className="text-center space-y-4">
        <div className="text-6xl">🎵</div>
        <p className="text-matrix-primary/80">
          Discover, create, and share music in a whole new way with AI-powered agents Hope, Muse, and Treasure.
        </p>
      </div>
    ),
  },
  {
    id: 'features',
    title: 'Explore Features',
    description: 'Everything you need in one place',
    content: (
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-matrix-dark/50 rounded-lg">
          <div className="text-2xl mb-2">🎧</div>
          <h4 className="font-semibold text-white mb-1">Library</h4>
          <p className="text-sm text-matrix-primary/60">Organize your music collection</p>
        </div>
        <div className="p-4 bg-matrix-dark/50 rounded-lg">
          <div className="text-2xl mb-2">👥</div>
          <h4 className="font-semibold text-white mb-1">Social</h4>
          <p className="text-sm text-matrix-primary/60">Connect with artists</p>
        </div>
        <div className="p-4 bg-matrix-dark/50 rounded-lg">
          <div className="text-2xl mb-2">🎮</div>
          <h4 className="font-semibold text-white mb-1">StemStation</h4>
          <p className="text-sm text-matrix-primary/60">Play rhythm games</p>
        </div>
        <div className="p-4 bg-matrix-dark/50 rounded-lg">
          <div className="text-2xl mb-2">🛍️</div>
          <h4 className="font-semibold text-white mb-1">Marketplace</h4>
          <p className="text-sm text-matrix-primary/60">Buy and sell music</p>
        </div>
      </div>
    ),
  },
  {
    id: 'agents',
    title: 'Meet Your AI Agents',
    description: 'Personalized music discovery',
    content: (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <div className="text-2xl">💙</div>
          <div>
            <h4 className="font-semibold text-blue-400">Hope</h4>
            <p className="text-sm text-blue-300/60">Discovers uplifting and inspiring tracks</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
          <div className="text-2xl">💜</div>
          <div>
            <h4 className="font-semibold text-purple-400">Muse</h4>
            <p className="text-sm text-purple-300/60">Curates creative and artistic music</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
          <div className="text-2xl">💚</div>
          <div>
            <h4 className="font-semibold text-green-400">Treasure</h4>
            <p className="text-sm text-green-300/60">Finds hidden gems and rare tracks</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Start exploring TapTap Matrix',
    content: (
      <div className="text-center space-y-4">
        <div className="text-6xl">✨</div>
        <p className="text-matrix-primary/80">
          You're ready to dive into the world of TapTap Matrix. Use <kbd className="px-2 py-1 bg-matrix-dark rounded text-sm">Cmd+K</kbd> to open the command palette anytime!
        </p>
      </div>
    ),
  },
];

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('taptap_onboarding_completed');
    if (!hasCompletedOnboarding) {
      setIsVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('taptap_onboarding_completed', 'true');
    setIsVisible(false);
  };

  const handleSkip = () => {
    localStorage.setItem('taptap_onboarding_completed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1400] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-2xl"
        >
          <Card className="bg-matrix-darker/95 border-matrix-primary/30 backdrop-blur-xl">
            <CardHeader
              title={step.title}
              subtitle={step.description}
              action={
                <Button variant="ghost" size="sm" onClick={handleSkip} className="text-matrix-primary/50 hover:text-matrix-primary">
                  <X className="w-4 h-4" />
                </Button>
              }
            />
            <CardContent className="space-y-6">
              {/* Step Content */}
              <div className="min-h-[300px]">{step.content}</div>

              {/* Progress Indicators */}
              <div className="flex justify-center gap-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all ${
                      index === currentStep
                        ? 'w-8 bg-matrix-primary'
                        : index < currentStep
                        ? 'w-2 bg-matrix-primary/50'
                        : 'w-2 bg-matrix-primary/20'
                    }`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="border-matrix-primary/30"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button onClick={handleNext} className="bg-matrix-primary hover:bg-matrix-secondary text-black">
                  {currentStep === steps.length - 1 ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Get Started
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

