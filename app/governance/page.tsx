"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Vote,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  TrendingUp,
  Coins,
  Shield,
  FileText,
  Calendar
} from 'lucide-react';

interface Proposal {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  quorumReached: boolean;
  votingEndsAt: string;
  proposer: {
    username: string;
    displayName: string;
  };
  _count: {
    votes: number;
  };
}

export default function GovernancePage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [userVotingPower, setUserVotingPower] = useState(0);

  useEffect(() => {
    loadProposals();
    loadUserVotingPower();
  }, [filter]);

  const loadProposals = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      
      const response = await fetch(`/api/governance/proposals?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setProposals(data.proposals);
      }
    } catch (error) {
      console.error('Failed to load proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserVotingPower = async () => {
    try {
      const response = await fetch('/api/governance/voting-power');
      const data = await response.json();
      
      if (response.ok) {
        setUserVotingPower(data.votingPower);
      }
    } catch (error) {
      console.error('Failed to load voting power:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'SUCCEEDED':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'DEFEATED':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'EXECUTED':
        return <Shield className="h-4 w-4 text-blue-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'PARAMETER_CHANGE': 'bg-blue-500/20 text-blue-300',
      'TREASURY_SPEND': 'bg-green-500/20 text-green-300',
      'FEATURE_REQUEST': 'bg-purple-500/20 text-purple-300',
      'PLATFORM_UPGRADE': 'bg-orange-500/20 text-orange-300',
      'FEE_ADJUSTMENT': 'bg-yellow-500/20 text-yellow-300',
      'PARTNERSHIP': 'bg-pink-500/20 text-pink-300',
      'EMERGENCY': 'bg-red-500/20 text-red-300',
    };
    return colors[type] || 'bg-gray-500/20 text-gray-300';
  };

  const formatTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-[#031a1a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Governance</h1>
              <p className="text-white/70">Shape the future of TapTap through community proposals</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-white/60">Your Voting Power</div>
                <div className="text-xl font-bold text-teal-300">{userVotingPower.toLocaleString()} TAP</div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Proposal
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <Vote className="h-8 w-8 text-teal-400" />
              <div>
                <div className="text-2xl font-bold text-white">{proposals.length}</div>
                <div className="text-sm text-white/60">Total Proposals</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">{proposals.filter(p => p.status === 'ACTIVE').length}</div>
                <div className="text-sm text-white/60">Active Votes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'ACTIVE', 'SUCCEEDED', 'DEFEATED', 'EXECUTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-teal-500 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Proposals List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-white/60">Loading proposals...</div>
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-white/30 mx-auto mb-4" />
              <div className="text-white/60">No proposals found</div>
            </div>
          ) : (
            proposals.map((proposal) => (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(proposal.status)}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(proposal.type)}`}>
                        {proposal.type.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-white/60">
                        by @{proposal.proposer.username}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{proposal.title}</h3>
                    <p className="text-white/70 line-clamp-2">{proposal.description}</p>
                  </div>
                  <div className="text-right ml-6">
                    <div className="text-sm text-white/60 mb-1">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      {formatTimeRemaining(proposal.votingEndsAt)}
                    </div>
                    <div className="text-sm text-white/60">
                      {proposal._count.votes} votes
                    </div>
                  </div>
                </div>

                {/* Vote Results */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-400">For: {proposal.votesFor.toLocaleString()}</span>
                    <span className="text-red-400">Against: {proposal.votesAgainst.toLocaleString()}</span>
                    <span className="text-gray-400">Abstain: {proposal.votesAbstain.toLocaleString()}</span>
                  </div>

                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="flex h-full rounded-full overflow-hidden">
                      <div
                        className="bg-green-500"
                        style={{
                          width: `${(proposal.votesFor / (proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain)) * 100}%`
                        }}
                      />
                      <div
                        className="bg-red-500"
                        style={{
                          width: `${(proposal.votesAgainst / (proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain)) * 100}%`
                        }}
                      />
                      <div
                        className="bg-gray-500"
                        style={{
                          width: `${(proposal.votesAbstain / (proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {proposal.status === 'ACTIVE' && (
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                      Vote For
                    </button>
                    <button className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                      Vote Against
                    </button>
                    <button className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                      Abstain
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
