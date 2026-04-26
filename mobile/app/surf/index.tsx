import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FlashList } from '@shopify/flash-list';
import {
  Play,
  Search,
  TrendingUp,
  Clock,
  Eye,
  ThumbsUp,
  Share2,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface Video {
  id: string;
  title: string;
  channel: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
  };
  thumbnail?: string;
  duration: string;
  views: number;
  uploadedAt: string;
  likes: number;
}

export default function SurfScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'trending' | 'subscribed'>('all');

  useEffect(() => {
    loadVideos();
  }, [filter]);

  async function loadVideos() {
    // Mock data - replace with API call
    const mockVideos: Video[] = [
      {
        id: '1',
        title: 'Midnight Dreams - Official Music Video',
        channel: {
          id: '1',
          name: 'Luna Eclipse',
          verified: true,
        },
        duration: '3:45',
        views: 1234567,
        uploadedAt: '2 days ago',
        likes: 45678,
      },
      {
        id: '2',
        title: 'Electric Soul - Behind The Scenes',
        channel: {
          id: '2',
          name: 'Neon Pulse',
          verified: true,
        },
        duration: '8:12',
        views: 892345,
        uploadedAt: '1 week ago',
        likes: 34567,
      },
      {
        id: '3',
        title: 'Studio Session: Creating Cosmic Waves',
        channel: {
          id: '3',
          name: 'Star Voyager',
          verified: true,
        },
        duration: '15:30',
        views: 567890,
        uploadedAt: '3 days ago',
        likes: 23456,
      },
    ];
    setVideos(mockVideos);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadVideos();
    setRefreshing(false);
  }

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  return (
    <LinearGradient
      colors={['#000000', '#1a0033', '#000000']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Surf</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerButton}>
            <TrendingUp color="#FFFFFF" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search color="rgba(255, 255, 255, 0.4)" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search videos..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'trending' && styles.filterTabActive]}
          onPress={() => setFilter('trending')}
        >
          <TrendingUp
            color={filter === 'trending' ? '#8B5CF6' : 'rgba(255, 255, 255, 0.6)'}
            size={16}
          />
          <Text style={[styles.filterText, filter === 'trending' && styles.filterTextActive]}>
            Trending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'subscribed' && styles.filterTabActive]}
          onPress={() => setFilter('subscribed')}
        >
          <Text style={[styles.filterText, filter === 'subscribed' && styles.filterTextActive]}>
            Subscribed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Videos */}
      <FlashList
        data={videos}
        estimatedItemSize={280}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50)}>
            <VideoCard video={item} formatViews={formatViews} />
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

function VideoCard({ video, formatViews }: { video: Video; formatViews: (n: number) => string }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.videoCard}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/surf/watch/${video.id}`);
      }}
      activeOpacity={0.9}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnail}>
        <LinearGradient
          colors={['#8B5CF6', '#EC4899']}
          style={styles.thumbnailGradient}
        >
          <Play color="#FFFFFF" size={48} fill="#FFFFFF" />
        </LinearGradient>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{video.duration}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.videoInfo}>
        {/* Channel Avatar */}
        <View style={styles.channelAvatar}>
          <Text style={styles.channelAvatarText}>
            {video.channel.name.charAt(0)}
          </Text>
        </View>

        {/* Details */}
        <View style={styles.videoDetails}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {video.title}
          </Text>
          
          <View style={styles.channelInfo}>
            <Text style={styles.channelName}>
              {video.channel.name}
            </Text>
            {video.channel.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            )}
          </View>

          <View style={styles.videoMeta}>
            <View style={styles.metaItem}>
              <Eye color="rgba(255, 255, 255, 0.5)" size={14} />
              <Text style={styles.metaText}>{formatViews(video.views)} views</Text>
            </View>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{video.uploadedAt}</Text>
          </View>

          <View style={styles.videoActions}>
            <View style={styles.actionItem}>
              <ThumbsUp color="rgba(255, 255, 255, 0.6)" size={16} />
              <Text style={styles.actionText}>{formatViews(video.likes)}</Text>
            </View>
            <TouchableOpacity style={styles.actionItem}>
              <Share2 color="rgba(255, 255, 255, 0.6)" size={16} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  videoCard: {
    marginBottom: 24,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  thumbnailGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  videoInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  channelAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  videoDetails: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 6,
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  channelName: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  metaDot: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  videoActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

