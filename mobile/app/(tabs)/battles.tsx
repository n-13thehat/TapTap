import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FlashList } from '@shopify/flash-list';
import {
  Swords,
  Trophy,
  Clock,
  TrendingUp,
  Plus,
  Play,
  Users,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface Battle {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'upcoming' | 'ended';
  endTime: string;
  prizePool: number;
  participants: number;
  tracks: {
    id: string;
    title: string;
    artist: string;
    votes: number;
    percentage: number;
    hasVoted: boolean;
  }[];
}

export default function BattlesScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [filter, setFilter] = useState<'active' | 'upcoming' | 'ended'>('active');

  useEffect(() => {
    loadBattles();
  }, [filter]);

  async function loadBattles() {
    // Mock data - replace with API call
    const mockBattles: Battle[] = [
      {
        id: '1',
        title: 'Best Electronic Track',
        description: 'Vote for the best electronic music track of the week!',
        status: 'active',
        endTime: '2h 34m',
        prizePool: 5000,
        participants: 1234,
        tracks: [
          {
            id: '1',
            title: 'Midnight Dreams',
            artist: 'Luna Eclipse',
            votes: 567,
            percentage: 46,
            hasVoted: false,
          },
          {
            id: '2',
            title: 'Electric Soul',
            artist: 'Neon Pulse',
            votes: 667,
            percentage: 54,
            hasVoted: false,
          },
        ],
      },
      {
        id: '2',
        title: 'Hip-Hop Showdown',
        description: 'The ultimate hip-hop battle!',
        status: 'active',
        endTime: '5h 12m',
        prizePool: 10000,
        participants: 2456,
        tracks: [
          {
            id: '3',
            title: 'Street Dreams',
            artist: 'MC Flow',
            votes: 890,
            percentage: 36,
            hasVoted: true,
          },
          {
            id: '4',
            title: 'City Lights',
            artist: 'Urban Poet',
            votes: 1566,
            percentage: 64,
            hasVoted: false,
          },
        ],
      },
    ];
    setBattles(mockBattles);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadBattles();
    setRefreshing(false);
  }

  const handleVote = (battleId: string, trackId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Update vote - replace with API call
    setBattles(battles.map(battle => {
      if (battle.id === battleId) {
        return {
          ...battle,
          tracks: battle.tracks.map(track => ({
            ...track,
            hasVoted: track.id === trackId,
            votes: track.id === trackId ? track.votes + 1 : track.votes,
          })),
        };
      }
      return battle;
    }));
  };

  return (
    <LinearGradient
      colors={['#000000', '#1a0033', '#000000']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Swords color="#8B5CF6" size={32} />
          <Text style={styles.headerTitle}>Battles</Text>
        </View>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => router.push('/battles/create')}
        >
          <Plus color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
        contentContainerStyle={styles.statsContent}
      >
        <StatCard icon={Trophy} label="Total Prize" value="$50K" color="#F59E0B" />
        <StatCard icon={Users} label="Participants" value="12.5K" color="#8B5CF6" />
        <StatCard icon={TrendingUp} label="Active" value="24" color="#10B981" />
      </ScrollView>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'upcoming' && styles.filterTabActive]}
          onPress={() => setFilter('upcoming')}
        >
          <Text style={[styles.filterText, filter === 'upcoming' && styles.filterTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'ended' && styles.filterTabActive]}
          onPress={() => setFilter('ended')}
        >
          <Text style={[styles.filterText, filter === 'ended' && styles.filterTextActive]}>
            Ended
          </Text>
        </TouchableOpacity>
      </View>

      {/* Battles List */}
      <FlashList
        data={battles}
        estimatedItemSize={400}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50)}>
            <BattleCard battle={item} onVote={handleVote} />
          </Animated.View>
        )}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </LinearGradient>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <View style={[styles.statCard, { borderColor: `${color}40` }]}>
      <Icon color={color} size={24} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function BattleCard({ battle, onVote }: { battle: Battle; onVote: (battleId: string, trackId: string) => void }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.battleCard}
      onPress={() => router.push(`/battles/${battle.id}`)}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.05)']}
        style={styles.battleCardGradient}
      >
        {/* Header */}
        <View style={styles.battleHeader}>
          <View style={styles.battleTitleContainer}>
            <Text style={styles.battleTitle}>{battle.title}</Text>
            <Text style={styles.battleDescription}>{battle.description}</Text>
          </View>
          <View style={styles.battleStatus}>
            <Clock color="#F59E0B" size={16} />
            <Text style={styles.battleTime}>{battle.endTime}</Text>
          </View>
        </View>

        {/* Prize & Participants */}
        <View style={styles.battleMeta}>
          <View style={styles.metaItem}>
            <Trophy color="#F59E0B" size={16} />
            <Text style={styles.metaText}>${battle.prizePool.toLocaleString()}</Text>
          </View>
          <View style={styles.metaItem}>
            <Users color="#8B5CF6" size={16} />
            <Text style={styles.metaText}>{battle.participants.toLocaleString()}</Text>
          </View>
        </View>

        {/* Tracks */}
        <View style={styles.tracksContainer}>
          {battle.tracks.map((track, index) => (
            <View key={track.id} style={styles.trackItem}>
              <View style={styles.trackInfo}>
                <View style={styles.trackCover}>
                  <Play color="#8B5CF6" size={16} fill="#8B5CF6" />
                </View>
                <View style={styles.trackDetails}>
                  <Text style={styles.trackTitle}>{track.title}</Text>
                  <Text style={styles.trackArtist}>{track.artist}</Text>
                </View>
              </View>

              {/* Vote Progress */}
              <View style={styles.voteContainer}>
                <View style={styles.voteBar}>
                  <View 
                    style={[
                      styles.voteProgress, 
                      { 
                        width: `${track.percentage}%`,
                        backgroundColor: track.hasVoted ? '#8B5CF6' : 'rgba(139, 92, 246, 0.5)',
                      }
                    ]} 
                  />
                </View>
                <View style={styles.voteStats}>
                  <Text style={styles.votePercentage}>{track.percentage}%</Text>
                  <Text style={styles.voteCount}>{track.votes} votes</Text>
                </View>
              </View>

              {/* Vote Button */}
              <TouchableOpacity
                style={[
                  styles.voteButton,
                  track.hasVoted && styles.voteButtonActive,
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  onVote(battle.id, track.id);
                }}
                disabled={track.hasVoted}
              >
                <Text style={[
                  styles.voteButtonText,
                  track.hasVoted && styles.voteButtonTextActive,
                ]}>
                  {track.hasVoted ? 'Voted' : 'Vote'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </LinearGradient>
    </TouchableOpacity>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    maxHeight: 100,
    marginBottom: 16,
  },
  statsContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    width: 120,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  filterText: {
    fontSize: 14,
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
  battleCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  battleCardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 16,
  },
  battleHeader: {
    marginBottom: 16,
  },
  battleTitleContainer: {
    marginBottom: 8,
  },
  battleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  battleDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  battleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  battleTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  battleMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tracksContainer: {
    gap: 12,
  },
  trackItem: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  trackCover: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackDetails: {
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
  voteContainer: {
    marginBottom: 12,
  },
  voteBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  voteProgress: {
    height: '100%',
    borderRadius: 3,
  },
  voteStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  votePercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  voteCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  voteButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    alignItems: 'center',
  },
  voteButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  voteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  voteButtonTextActive: {
    color: '#FFFFFF',
  },
});

