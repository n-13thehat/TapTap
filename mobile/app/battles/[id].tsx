import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Trophy,
  Clock,
  Users,
  Play,
  Share2,
  TrendingUp,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface Track {
  id: string;
  title: string;
  artist: string;
  votes: number;
  percentage: number;
  hasVoted: boolean;
  rank: number;
}

export default function BattleDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const battle = {
    id: params.id as string,
    title: 'Best Electronic Track',
    description: 'Vote for the best electronic music track of the week! The winner gets featured on our homepage and receives 5000 TAP tokens.',
    status: 'active' as const,
    endTime: '2h 34m',
    prizePool: 5000,
    participants: 1234,
    totalVotes: 1234,
    createdBy: {
      id: '1',
      name: 'TapTap Official',
      verified: true,
    },
    rules: [
      'One vote per user',
      'Voting ends in 2 hours',
      'Winner announced immediately after',
      'Prize distributed within 24 hours',
    ],
  };

  const [tracks, setTracks] = useState<Track[]>([
    {
      id: '1',
      title: 'Midnight Dreams',
      artist: 'Luna Eclipse',
      votes: 567,
      percentage: 46,
      hasVoted: false,
      rank: 2,
    },
    {
      id: '2',
      title: 'Electric Soul',
      artist: 'Neon Pulse',
      votes: 667,
      percentage: 54,
      hasVoted: false,
      rank: 1,
    },
  ]);

  const handleVote = (trackId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setTracks(tracks.map(track => ({
      ...track,
      hasVoted: track.id === trackId,
      votes: track.id === trackId ? track.votes + 1 : track.votes,
    })));
  };

  return (
    <LinearGradient
      colors={['#000000', '#1a0033', '#000000']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <ArrowLeft color="#FFFFFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Battle Details</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Share2 color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Battle Info */}
        <View style={styles.battleInfo}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.05)']}
            style={styles.battleInfoGradient}
          >
            <Text style={styles.battleTitle}>{battle.title}</Text>
            <Text style={styles.battleDescription}>{battle.description}</Text>

            {/* Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Trophy color="#F59E0B" size={24} />
                <Text style={styles.statValue}>${battle.prizePool.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Prize Pool</Text>
              </View>

              <View style={styles.statCard}>
                <Users color="#8B5CF6" size={24} />
                <Text style={styles.statValue}>{battle.participants.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Participants</Text>
              </View>

              <View style={styles.statCard}>
                <Clock color="#F59E0B" size={24} />
                <Text style={styles.statValue}>{battle.endTime}</Text>
                <Text style={styles.statLabel}>Time Left</Text>
              </View>
            </View>

            {/* Created By */}
            <View style={styles.createdBy}>
              <Text style={styles.createdByLabel}>Created by</Text>
              <View style={styles.creatorInfo}>
                <View style={styles.creatorAvatar}>
                  <Text style={styles.creatorAvatarText}>
                    {battle.createdBy.name.charAt(0)}
                  </Text>
                </View>
                <Text style={styles.creatorName}>{battle.createdBy.name}</Text>
                {battle.createdBy.verified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✓</Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Leaderboard Button */}
        <TouchableOpacity
          style={styles.leaderboardButton}
          onPress={() => router.push(`/battles/leaderboard?id=${battle.id}`)}
        >
          <TrendingUp color="#8B5CF6" size={20} />
          <Text style={styles.leaderboardButtonText}>View Full Leaderboard</Text>
        </TouchableOpacity>

        {/* Tracks */}
        <View style={styles.tracksSection}>
          <Text style={styles.sectionTitle}>
            Competing Tracks ({tracks.length})
          </Text>

          {tracks
            .sort((a, b) => b.votes - a.votes)
            .map((track, index) => (
              <Animated.View
                key={track.id}
                entering={FadeInDown.delay(index * 50)}
              >
                <TrackCard
                  track={track}
                  onVote={() => handleVote(track.id)}
                  hasVoted={tracks.some(t => t.hasVoted)}
                />
              </Animated.View>
            ))}
        </View>

        {/* Rules */}
        <View style={styles.rulesSection}>
          <Text style={styles.sectionTitle}>Battle Rules</Text>
          {battle.rules.map((rule, index) => (
            <View key={index} style={styles.ruleItem}>
              <View style={styles.ruleBullet} />
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </LinearGradient>
  );
}

function TrackCard({
  track,
  onVote,
  hasVoted,
}: {
  track: Track;
  onVote: () => void;
  hasVoted: boolean;
}) {
  return (
    <View style={styles.trackCard}>
      <LinearGradient
        colors={
          track.rank === 1
            ? ['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.05)']
            : ['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.02)']
        }
        style={styles.trackCardGradient}
      >
        {/* Rank Badge */}
        <View
          style={[
            styles.rankBadge,
            track.rank === 1 && styles.rankBadgeFirst,
          ]}
        >
          <Text style={styles.rankText}>#{track.rank}</Text>
        </View>

        {/* Track Info */}
        <View style={styles.trackHeader}>
          <View style={styles.trackCover}>
            <Play color="#8B5CF6" size={20} fill="#8B5CF6" />
          </View>
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle}>{track.title}</Text>
            <Text style={styles.trackArtist}>{track.artist}</Text>
          </View>
        </View>

        {/* Vote Progress */}
        <View style={styles.voteProgress}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${track.percentage}%`,
                  backgroundColor: track.hasVoted
                    ? '#8B5CF6'
                    : track.rank === 1
                    ? '#F59E0B'
                    : 'rgba(139, 92, 246, 0.5)',
                },
              ]}
            />
          </View>
          <View style={styles.voteStats}>
            <Text style={styles.votePercentage}>{track.percentage}%</Text>
            <Text style={styles.voteCount}>{track.votes.toLocaleString()} votes</Text>
          </View>
        </View>

        {/* Vote Button */}
        <TouchableOpacity
          style={[
            styles.voteButton,
            track.hasVoted && styles.voteButtonActive,
            hasVoted && !track.hasVoted && styles.voteButtonDisabled,
          ]}
          onPress={onVote}
          disabled={hasVoted}
        >
          <Text
            style={[
              styles.voteButtonText,
              track.hasVoted && styles.voteButtonTextActive,
            ]}
          >
            {track.hasVoted ? '✓ Voted' : hasVoted ? 'Already Voted' : 'Vote'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  battleInfo: {
    padding: 20,
  },
  battleInfoGradient: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  battleTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  battleDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  createdBy: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  createdByLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creatorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  leaderboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  leaderboardButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  tracksSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  trackCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  trackCardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 16,
  },
  rankBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  rankBadgeFirst: {
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  trackCover: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  voteProgress: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  voteStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  votePercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  voteCount: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  voteButton: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    alignItems: 'center',
  },
  voteButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  voteButtonDisabled: {
    opacity: 0.5,
  },
  voteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  voteButtonTextActive: {
    color: '#FFFFFF',
  },
  rulesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  ruleBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8B5CF6',
    marginTop: 7,
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});

