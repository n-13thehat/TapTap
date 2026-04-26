import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FlashList } from '@shopify/flash-list';
import { 
  Home as HomeIcon, 
  TrendingUp, 
  Music, 
  Users,
  Play,
  Heart,
  Share2,
  MoreVertical
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [featuredTracks, setFeaturedTracks] = useState([]);
  const [trendingArtists, setTrendingArtists] = useState([]);

  useEffect(() => {
    loadHomeData();
  }, []);

  async function loadHomeData() {
    // TODO: Load from API
    setFeaturedTracks([
      { id: '1', title: 'Midnight Dreams', artist: 'Luna Eclipse', plays: '1.2M', coverUrl: null },
      { id: '2', title: 'Electric Soul', artist: 'Neon Pulse', plays: '890K', coverUrl: null },
      { id: '3', title: 'Cosmic Waves', artist: 'Star Voyager', plays: '2.1M', coverUrl: null },
    ]);
    
    setTrendingArtists([
      { id: '1', name: 'Luna Eclipse', followers: '45K', avatarUrl: null },
      { id: '2', name: 'Neon Pulse', followers: '32K', avatarUrl: null },
      { id: '3', name: 'Star Voyager', followers: '67K', avatarUrl: null },
    ]);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  }

  return (
    <LinearGradient
      colors={['#000000', '#1a0033', '#000000']}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown} style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.title}>TapTap Matrix</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.quickActions}>
          <QuickActionCard
            icon={<Music color="#8B5CF6" size={24} />}
            title="Library"
            subtitle="Your music"
            onPress={() => router.push('/(tabs)/music')}
          />
          <QuickActionCard
            icon={<Users color="#EC4899" size={24} />}
            title="Social"
            subtitle="Connect"
            onPress={() => router.push('/(tabs)/social')}
          />
          <QuickActionCard
            icon={<TrendingUp color="#10B981" size={24} />}
            title="Trending"
            subtitle="Hot now"
            onPress={() => {}}
          />
        </Animated.View>

        {/* Featured Tracks */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Tracks</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {featuredTracks.map((track, index) => (
            <TrackCard key={track.id} track={track} index={index} />
          ))}
        </Animated.View>

        {/* Trending Artists */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Artists</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.artistScroll}>
            {trendingArtists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </ScrollView>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

function QuickActionCard({ icon, title, subtitle, onPress }: any) {
  return (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.05)']}
        style={styles.quickActionGradient}
      >
        <View style={styles.quickActionIcon}>{icon}</View>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function TrackCard({ track, index }: any) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50)}>
      <TouchableOpacity style={styles.trackCard} activeOpacity={0.7}>
        <View style={styles.trackCover}>
          <Music color="#8B5CF6" size={24} />
        </View>
        
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle}>{track.title}</Text>
          <Text style={styles.trackArtist}>{track.artist}</Text>
          <Text style={styles.trackPlays}>{track.plays} plays</Text>
        </View>
        
        <View style={styles.trackActions}>
          <TouchableOpacity style={styles.trackActionButton}>
            <Play color="#FFFFFF" size={20} fill="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.trackActionButton}>
            <Heart color="rgba(255, 255, 255, 0.6)" size={18} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function ArtistCard({ artist }: any) {
  return (
    <TouchableOpacity style={styles.artistCard} activeOpacity={0.7}>
      <View style={styles.artistAvatar}>
        <Users color="#8B5CF6" size={32} />
      </View>
      <Text style={styles.artistName}>{artist.name}</Text>
      <Text style={styles.artistFollowers}>{artist.followers} followers</Text>
      <TouchableOpacity style={styles.followButton}>
        <Text style={styles.followButtonText}>Follow</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickActionGradient: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 16,
  },
  quickActionIcon: {
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  seeAll: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  trackCover: {
    width: 56,
    height: 56,
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
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  trackPlays: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  trackActions: {
    flexDirection: 'row',
    gap: 12,
  },
  trackActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artistScroll: {
    paddingLeft: 20,
  },
  artistCard: {
    width: 140,
    marginRight: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
  },
  artistAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  artistName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  artistFollowers: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

