import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FlashList } from '@shopify/flash-list';
import {
  ArrowLeft,
  Trophy,
  Medal,
  TrendingUp,
  Play,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface LeaderboardEntry {
  rank: number;
  track: {
    id: string;
    title: string;
    artist: string;
  };
  votes: number;
  percentage: number;
  trend: 'up' | 'down' | 'same';
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');

  const leaderboard: LeaderboardEntry[] = [
    {
      rank: 1,
      track: { id: '1', title: 'Electric Soul', artist: 'Neon Pulse' },
      votes: 667,
      percentage: 54,
      trend: 'up',
    },
    {
      rank: 2,
      track: { id: '2', title: 'Midnight Dreams', artist: 'Luna Eclipse' },
      votes: 567,
      percentage: 46,
      trend: 'down',
    },
    {
      rank: 3,
      track: { id: '3', title: 'Cosmic Waves', artist: 'Star Voyager' },
      votes: 445,
      percentage: 36,
      trend: 'up',
    },
  ];

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
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Top 3 Podium */}
      <View style={styles.podium}>
        {/* 2nd Place */}
        <PodiumCard entry={leaderboard[1]} />
        {/* 1st Place */}
        <PodiumCard entry={leaderboard[0]} isFirst />
        {/* 3rd Place */}
        <PodiumCard entry={leaderboard[2]} />
      </View>

      {/* Time Filter */}
      <View style={styles.filterContainer}>
        {(['all', 'week', 'month'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              timeFilter === filter && styles.filterButtonActive,
            ]}
            onPress={() => setTimeFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                timeFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter === 'all' ? 'All Time' : filter === 'week' ? 'This Week' : 'This Month'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Full List */}
      <FlashList
        data={leaderboard}
        estimatedItemSize={80}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50)}>
            <LeaderboardRow entry={item} />
          </Animated.View>
        )}
        keyExtractor={(item) => item.track.id}
        contentContainerStyle={styles.listContent}
      />
    </LinearGradient>
  );
}

function PodiumCard({ entry, isFirst = false }: { entry: LeaderboardEntry; isFirst?: boolean }) {
  return (
    <View style={[styles.podiumCard, isFirst && styles.podiumCardFirst]}>
      <View style={[styles.podiumRank, isFirst && styles.podiumRankFirst]}>
        {entry.rank === 1 ? (
          <Trophy color="#F59E0B" size={isFirst ? 32 : 24} />
        ) : (
          <Medal color={entry.rank === 2 ? '#C0C0C0' : '#CD7F32'} size={24} />
        )}
      </View>
      <Text style={[styles.podiumTitle, isFirst && styles.podiumTitleFirst]} numberOfLines={1}>
        {entry.track.title}
      </Text>
      <Text style={styles.podiumArtist} numberOfLines={1}>
        {entry.track.artist}
      </Text>
      <Text style={[styles.podiumVotes, isFirst && styles.podiumVotesFirst]}>
        {entry.votes} votes
      </Text>
    </View>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <View style={styles.row}>
      <View style={[styles.rankBadge, entry.rank <= 3 && styles.rankBadgeTop]}>
        <Text style={styles.rankText}>#{entry.rank}</Text>
      </View>

      <View style={styles.trackCover}>
        <Play color="#8B5CF6" size={16} fill="#8B5CF6" />
      </View>

      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {entry.track.title}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {entry.track.artist}
        </Text>
      </View>

      <View style={styles.voteInfo}>
        <Text style={styles.voteCount}>{entry.votes}</Text>
        <Text style={styles.voteLabel}>votes</Text>
      </View>

      <View style={[styles.trendBadge, styles[`trend${entry.trend.charAt(0).toUpperCase() + entry.trend.slice(1)}`]]}>
        <TrendingUp
          color={entry.trend === 'up' ? '#10B981' : entry.trend === 'down' ? '#EF4444' : '#6B7280'}
          size={16}
          style={entry.trend === 'down' && { transform: [{ rotate: '180deg' }] }}
        />
      </View>
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
  placeholder: {
    width: 40,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  podiumCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  podiumCardFirst: {
    paddingVertical: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  podiumRank: {
    marginBottom: 8,
  },
  podiumRankFirst: {
    marginBottom: 12,
  },
  podiumTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  podiumTitleFirst: {
    fontSize: 14,
  },
  podiumArtist: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
    textAlign: 'center',
  },
  podiumVotes: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  podiumVotesFirst: {
    fontSize: 13,
    color: '#F59E0B',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: '#8B5CF6',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  filterTextActive: {
    color: '#8B5CF6',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeTop: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trackCover: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  voteInfo: {
    alignItems: 'flex-end',
  },
  voteCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  voteLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  trendBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendUp: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  trendDown: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  trendSame: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
  },
});

