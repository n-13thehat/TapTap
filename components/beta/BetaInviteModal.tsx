"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Crown,
  Sparkles,
  Gift,
  Users,
  Trophy,
  Copy,
  Check,
  Share2,
  Mail
} from 'lucide-react';

interface BetaInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode?: string;
}

export default function BetaInviteModal({ isOpen, onClose, inviteCode = 'BETA-MUSIC2024' }: BetaInviteModalProps) {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [invitesSent, setInvitesSent] = useState(0);

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy invite code:', error);
    }
  };

  const shareInvite = async () => {
    const shareData = {
      title: 'Join TapTap Matrix Beta!',
      text: `You're invited to join the exclusive TapTap Matrix beta program! Use code: ${inviteCode}`,
      url: `${window.location.origin}/beta?invite=${inviteCode}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      await navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sendEmailInvite = () => {
    if (email) {
      // Simulate sending email invite
      setInvitesSent(prev => prev + 1);
      setEmail('');
      
      // In real implementation, this would call an API
      console.log(`Sending beta invite to: ${email}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl p-6 shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/60 hover:text-white/80 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-full px-4 py-2 mb-4">
                <Crown className="h-4 w-4 text-purple-300" />
                <span className="text-purple-300 font-medium text-sm">Beta Invite</span>
                <Sparkles className="h-3 w-3 text-pink-300" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Invite Friends to Beta</h2>
              <p className="text-white/70 text-sm">
                Share the future of music with your friends and earn rewards for each successful invite!
              </p>
            </div>

            {/* Invite Code */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Your Invite Code</span>
                <button
                  onClick={copyInviteCode}
                  className="flex items-center gap-1 text-teal-400 hover:text-teal-300 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="font-mono text-lg text-white bg-black/20 rounded-lg px-3 py-2 text-center">
                {inviteCode}
              </div>
            </div>

            {/* Rewards Info */}
            <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 border border-teal-400/20 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="h-4 w-4 text-teal-400" />
                <span className="text-teal-300 font-medium text-sm">Referral Rewards</span>
              </div>
              <div className="space-y-1 text-xs text-white/70">
                <div>• 500 TapCoins per successful invite</div>
                <div>• Tier upgrade after 3 invites</div>
                <div>• Special badges for top referrers</div>
              </div>
            </div>

            {/* Email Invite */}
            <div className="mb-6">
              <label className="block text-white/60 text-sm mb-2">Send Email Invite</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-teal-400/50"
                />
                <button
                  onClick={sendEmailInvite}
                  disabled={!email}
                  className="bg-teal-500 hover:bg-teal-600 disabled:bg-white/10 disabled:text-white/40 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Mail className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={shareInvite}
                className="flex-1 flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span>Share Invite</span>
              </button>
              
              <button
                onClick={copyInviteCode}
                className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl transition-colors"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Stats */}
            {invitesSent > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-center"
              >
                <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/30 rounded-full px-3 py-1">
                  <Trophy className="h-3 w-3 text-green-400" />
                  <span className="text-green-300 text-xs">
                    {invitesSent} invite{invitesSent !== 1 ? 's' : ''} sent!
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
