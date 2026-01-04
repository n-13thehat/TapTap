"use client";

import { useState } from 'react';
import { Trophy, Users, Clock, Play, Heart, Share2, Flag } from 'lucide-react';

interface BattleDetailsProps {
  battle?: any;
  onJoinBattle?: (battleId: string) => void;
  onVote?: (submissionId: string) => void;
  onBack?: () => void;
}

export default function BattleDetails({ battle, onJoinBattle, onVote, onBack }: BattleDetailsProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);

  const mockBattle = battle || {
    id: '1',
    title: 'Epic Beat Battle 2024',
    description: 'Show us your best electronic beats!',
    type: 'freestyle',
    status: 'active',
    duration: 7,
    timeRemaining: '3 days 12 hours',
    maxParticipants: 8,
    currentParticipants: 5,
    prize: 1000,
    genre: 'electronic',
    creator: {
      username: 'BeatMaster',
      avatar: '🎵'
    },
    submissions: [
      {
        id: '1',
        title: 'Neural Beats',
        artist: 'CyberSound',
        duration: '3:24',
        votes: 23,
        plays: 156,
        uploadedAt: '2 hours ago'
      },
      {
        id: '2',
        title: 'Digital Dreams',
        artist: 'TechVibes',
        duration: '4:12',
        votes: 18,
        plays: 134,
        uploadedAt: '5 hours ago'
      },
      {
        id: '3',
        title: 'Matrix Flow',
        artist: 'CodeBeats',
        duration: '3:58',
        votes: 31,
        plays: 201,
        uploadedAt: '1 day ago'
      }
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'upcoming': return 'text-yellow-400';
      case 'completed': return 'text-blue-400';
      default: return 'text-white/60';
    }
  };

  const handleJoin = () => {
    if (onJoinBattle) {
      onJoinBattle(mockBattle.id);
    }
  };

  const handleVote = (submissionId: string) => {
    if (onVote) {
      onVote(submissionId);
    }
  };

  return (
    <div className="space-y-6">
      {onBack && (
        <div className="flex justify-end">
          <button
            onClick={onBack}
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            ← Back to battles
          </button>
        </div>
      )}
      {/* Battle Header */}
      <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-600/30 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{mockBattle.title}</h2>
            <p className="text-white/80 mb-3">{mockBattle.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className={`font-medium ${getStatusColor(mockBattle.status)}`}>
                {mockBattle.status.toUpperCase()}
              </span>
              <span className="text-white/60">by {mockBattle.creator.username}</span>
              <span className="text-white/60 capitalize">{mockBattle.genre}</span>
            </div>
          </div>
          <div className="text-center">
            <Trophy size={32} className="mx-auto mb-2 text-yellow-400" />
            <div className="text-2xl font-bold text-yellow-400">{mockBattle.prize}</div>
            <div className="text-sm text-white/60">TAP Prize</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <Clock size={20} className="mx-auto mb-1 text-blue-400" />
            <div className="text-white font-medium">{mockBattle.timeRemaining}</div>
            <div className="text-white/60 text-sm">Remaining</div>
          </div>
          <div className="text-center">
            <Users size={20} className="mx-auto mb-1 text-green-400" />
            <div className="text-white font-medium">{mockBattle.currentParticipants}/{mockBattle.maxParticipants}</div>
            <div className="text-white/60 text-sm">Participants</div>
          </div>
          <div className="text-center">
            <Play size={20} className="mx-auto mb-1 text-purple-400" />
            <div className="text-white font-medium">{mockBattle.submissions.reduce((sum: number, s: { plays: number }) => sum + s.plays, 0)}</div>
            <div className="text-white/60 text-sm">Total Plays</div>
          </div>
          <div className="text-center">
            <Heart size={20} className="mx-auto mb-1 text-red-400" />
            <div className="text-white font-medium">{mockBattle.submissions.reduce((sum: number, s: { votes: number }) => sum + s.votes, 0)}</div>
            <div className="text-white/60 text-sm">Total Votes</div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleJoin}
            className="bg-yellow-600 hover:bg-yellow-700 px-6 py-2 rounded-lg text-white font-medium transition-colors"
          >
            Join Battle
          </button>
          <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-white transition-colors">
            <Share2 size={16} />
          </button>
          <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-white transition-colors">
            <Flag size={16} />
          </button>
        </div>
      </div>

      {/* Submissions */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Submissions ({mockBattle.submissions.length})</h3>
        
        <div className="space-y-3">
          {mockBattle.submissions.map((submission: any, index: number) => (
            <div
              key={submission.id}
              className={`bg-white/5 rounded-lg p-4 transition-all hover:bg-white/10 ${
                selectedSubmission === submission.id ? 'ring-2 ring-yellow-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{submission.title}</h4>
                    <p className="text-white/60 text-sm">by {submission.artist}</p>
                    <div className="flex items-center gap-3 text-xs text-white/60 mt-1">
                      <span>{submission.duration}</span>
                      <span>{submission.uploadedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-white font-medium">{submission.votes}</div>
                    <div className="text-white/60 text-xs">Votes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-medium">{submission.plays}</div>
                    <div className="text-white/60 text-xs">Plays</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedSubmission(submission.id)}
                      className="w-10 h-10 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center transition-colors"
                    >
                      <Play size={16} />
                    </button>
                    <button
                      onClick={() => handleVote(submission.id)}
                      className="w-10 h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
                    >
                      <Heart size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {mockBattle.submissions.length === 0 && (
          <div className="text-center py-8">
            <Trophy size={48} className="mx-auto mb-4 text-white/20" />
            <p className="text-white/60 mb-4">No submissions yet</p>
            <p className="text-white/40 text-sm">Be the first to submit your track!</p>
          </div>
        )}
      </div>

      {/* Battle Rules */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Battle Rules</h3>
        <div className="space-y-2 text-white/80">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full" />
            <span>Original compositions only</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full" />
            <span>Maximum track length: 5 minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full" />
            <span>Genre: {mockBattle.genre}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full" />
            <span>Voting closes when battle ends</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full" />
            <span>Winner takes 70% of prize pool</span>
          </div>
        </div>
      </div>
    </div>
  );
}
