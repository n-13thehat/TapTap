"use client";

import React from 'react';
import { motion } from 'framer-motion';
import FeaturedSection from '@/components/library/FeaturedSection';
import AppLayout from '@/components/layout/AppLayout';

export default function FeaturedPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black text-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500/20 to-blue-500/20 border border-teal-400/30 rounded-full px-6 py-2 mb-6">
              <span className="text-yellow-400">⭐</span>
              <span className="text-teal-300 font-medium">Featured Collection</span>
              <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs font-medium">FREE</span>
            </div>
            
            <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-300 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Music For The Future
            </h1>
            
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Experience the groundbreaking collection that defines tomorrow's sound. 
              All tracks are free for TapTap Matrix users - start your journey into the future of music.
            </p>
          </motion.div>

          {/* Featured Content */}
          <FeaturedSection />

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-2xl">🆓</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Completely Free</h3>
              <p className="text-white/60">All tracks in this collection are free for all TapTap Matrix users. No hidden costs, no subscriptions.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-2xl">🎵</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">High Quality</h3>
              <p className="text-white/60">Experience crystal-clear audio streaming with our advanced playback technology.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Future Sound</h3>
              <p className="text-white/60">Discover the cutting-edge electronic music that's shaping tomorrow's musical landscape.</p>
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-16 text-center"
          >
            <div className="bg-gradient-to-r from-teal-500/20 via-blue-500/20 to-purple-500/20 border border-white/10 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Ready to explore more?</h2>
              <p className="text-white/70 mb-6 max-w-2xl mx-auto">
                This is just the beginning. TapTap Matrix offers a complete music platform with social features, 
                AI tools, battles, and a thriving marketplace. Join the community and discover your sound.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="/library"
                  className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Explore Library
                </a>
                <a
                  href="/social"
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Join Community
                </a>
                <a
                  href="/creator"
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Create Music
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
