"use client";

import React from 'react';
import { motion } from 'framer-motion';
import DiscoveryEngine from '@/components/discovery/DiscoveryEngine';
import AppLayout from '@/components/layout/AppLayout';
import { Brain, Sparkles, Zap, Music } from 'lucide-react';

export default function DiscoverPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500/20 to-blue-500/20 border border-teal-400/30 rounded-full px-6 py-3 mb-6">
              <Brain className="h-5 w-5 text-teal-300" />
              <span className="text-teal-300 font-medium">AI-Powered Discovery</span>
              <Sparkles className="h-4 w-4 text-blue-300" />
            </div>
            
            <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-300 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Discover Your Sound
            </h1>
            
            <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8">
              Our AI analyzes your Music For The Future collection to create personalized playlists 
              that adapt to your mood, time of day, and activity. Experience infinite discovery 
              from a curated collection.
            </p>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span>Smart Recommendations</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-teal-400" />
                <span>AI Music Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-purple-400" />
                <span>Dynamic Playlists</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-400" />
                <span>Contextual Discovery</span>
              </div>
            </div>
          </motion.div>

          {/* Discovery Engine */}
          <DiscoveryEngine />

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-16 bg-white/5 border border-white/10 rounded-2xl p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">How AI Discovery Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <Brain className="h-8 w-8 text-teal-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">AI Analysis</h3>
                <p className="text-white/70 text-sm">
                  Our AI analyzes each track's mood, energy, tempo, and emotional characteristics 
                  to understand the musical DNA of your collection.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Context Awareness</h3>
                <p className="text-white/70 text-sm">
                  Smart playlists adapt to your current time, activity, and mood preferences, 
                  creating the perfect soundtrack for any moment.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Dynamic Curation</h3>
                <p className="text-white/70 text-sm">
                  Playlists automatically update and evolve, ensuring you always discover 
                  new combinations and hidden gems within your music.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Features Highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div className="bg-gradient-to-br from-teal-500/10 to-teal-600/10 border border-teal-400/20 rounded-xl p-4">
              <h4 className="font-semibold text-teal-300 mb-2">Time-Based</h4>
              <p className="text-white/70 text-sm">Perfect playlists for morning energy, afternoon flow, evening vibes, and late-night dreams.</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-400/20 rounded-xl p-4">
              <h4 className="font-semibold text-blue-300 mb-2">Activity-Focused</h4>
              <p className="text-white/70 text-sm">Curated collections for work focus, workouts, relaxation, and creative sessions.</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-400/20 rounded-xl p-4">
              <h4 className="font-semibold text-purple-300 mb-2">Mood-Driven</h4>
              <p className="text-white/70 text-sm">Discover tracks that match your emotional state - energetic, uplifting, mysterious, or dreamy.</p>
            </div>

            <div className="bg-gradient-to-br from-pink-500/10 to-pink-600/10 border border-pink-400/20 rounded-xl p-4">
              <h4 className="font-semibold text-pink-300 mb-2">Smart Discovery</h4>
              <p className="text-white/70 text-sm">Hidden gems, daily discoveries, and complete journey playlists that reveal new depths.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
