import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FlashList } from '@shopify/flash-list';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreVertical,
  Plus,
  TrendingUp,
  Users as UsersIcon,
  Music,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
  };
  content: string;
  image?: string;
  track?: {
    id: string;
    title: string;
    artist: string;
  };
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
  timestamp: string;
}

export default function SocialScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<'all' | 'following' | 'trending'>('all');

  useEffect(() => {
    loadPosts();
  }, [filter]);

  async function loadPosts() {
    // Mock data - replace with API call
    const mockPosts: Post[] = [
      {
        id: '1',
        author: {
          id: '1',
          name: 'Luna Eclipse',
          verified: true,
        },
        content: 'Just dropped my new track "Midnight Dreams" 🌙✨ What do you think?',
        track: {
          id: '1',
          title: 'Midnight Dreams',
          artist: 'Luna Eclipse',
        },
        likes: 1234,
        comments: 89,
        shares: 45,
        liked: false,
        timestamp: '2h ago',
      },
      {
        id: '2',
        author: {
          id: '2',
          name: 'Neon Pulse',
          verified: true,
        },
        content: 'Studio vibes tonight 🎹 Working on something special...',
        image: null,
        likes: 892,
        comments: 56,
        shares: 23,
        liked: true,
        timestamp: '5h ago',
      },
    ];
    setPosts(mockPosts);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  }

  const handleLike = (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  return (
    <LinearGradient
      colors={['#000000', '#1a0033', '#000000']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Social</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => router.push('/social/create')}
        >
          <Plus color="#FFFFFF" size={24} />
        </TouchableOpacity>
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
          style={[styles.filterTab, filter === 'following' && styles.filterTabActive]}
          onPress={() => setFilter('following')}
        >
          <UsersIcon
            color={filter === 'following' ? '#8B5CF6' : 'rgba(255, 255, 255, 0.6)'}
            size={16}
          />
          <Text style={[styles.filterText, filter === 'following' && styles.filterTextActive]}>
            Following
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
      </View>

      {/* Feed */}
      <FlashList
        data={posts}
        estimatedItemSize={300}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50)}>
            <PostCard post={item} onLike={handleLike} />
          </Animated.View>
        )}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
        }
        showsVerticalScrollIndicator={false}
      />
    </LinearGradient>
  );
}

function PostCard({ post, onLike }: { post: Post; onLike: (id: string) => void }) {
  const router = useRouter();

  return (
    <View style={styles.postCard}>
      {/* Author */}
      <View style={styles.postHeader}>
        <TouchableOpacity 
          style={styles.authorInfo}
          onPress={() => router.push(`/social/profile/${post.author.id}`)}
        >
          <View style={styles.avatar}>
            <UsersIcon color="#8B5CF6" size={20} />
          </View>
          <View>
            <View style={styles.authorNameRow}>
              <Text style={styles.authorName}>{post.author.name}</Text>
              {post.author.verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓</Text>
                </View>
              )}
            </View>
            <Text style={styles.timestamp}>{post.timestamp}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical color="rgba(255, 255, 255, 0.6)" size={20} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Text style={styles.postContent}>{post.content}</Text>

      {/* Track Attachment */}
      {post.track && (
        <TouchableOpacity style={styles.trackAttachment}>
          <View style={styles.trackCover}>
            <Music color="#8B5CF6" size={20} />
          </View>
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle}>{post.track.title}</Text>
            <Text style={styles.trackArtist}>{post.track.artist}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onLike(post.id)}
        >
          <Heart
            color={post.liked ? '#EF4444' : 'rgba(255, 255, 255, 0.6)'}
            size={20}
            fill={post.liked ? '#EF4444' : 'none'}
          />
          <Text style={[styles.actionText, post.liked && styles.actionTextActive]}>
            {post.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push(`/social/post/${post.id}`)}
        >
          <MessageCircle color="rgba(255, 255, 255, 0.6)" size={20} />
          <Text style={styles.actionText}>{post.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Share2 color="rgba(255, 255, 255, 0.6)" size={20} />
          <Text style={styles.actionText}>{post.shares}</Text>
        </TouchableOpacity>
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
  postCard: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '700',
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
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  moreButton: {
    padding: 4,
  },
  postContent: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 12,
  },
  trackAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginBottom: 12,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  postActions: {
    flexDirection: 'row',
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  actionTextActive: {
    color: '#EF4444',
  },
});

