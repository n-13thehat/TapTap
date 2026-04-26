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
  MoreVertical,
  Music,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Play,
  UserPlus,
  UserCheck,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface Post {
  id: string;
  content: string;
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

export default function UserProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);

  // Mock user data
  const user = {
    id: params.id as string,
    name: 'Luna Eclipse',
    username: '@lunaeclipse',
    bio: 'Electronic music producer 🎵 | Creating midnight vibes ✨ | New EP coming soon 🌙',
    verified: true,
    followers: 12500,
    following: 234,
    posts: 89,
    avatar: null,
  };

  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
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
      content: 'Studio vibes tonight 🎹 Working on something special...',
      likes: 892,
      comments: 56,
      shares: 23,
      liked: true,
      timestamp: '5h ago',
    },
  ]);

  const handleFollow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFollowing(!isFollowing);
  };

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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <ArrowLeft color="#FFFFFF" size={24} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{user.name}</Text>
          <Text style={styles.headerPosts}>{user.posts} posts</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {user.name.charAt(0)}
              </Text>
            </LinearGradient>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.posts}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {user.followers >= 1000 
                  ? `${(user.followers / 1000).toFixed(1)}K` 
                  : user.followers}
              </Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          {/* Name & Bio */}
          <View style={styles.infoContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user.name}</Text>
              {user.verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓</Text>
                </View>
              )}
            </View>
            <Text style={styles.username}>{user.username}</Text>
            <Text style={styles.bio}>{user.bio}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing && styles.followingButton,
              ]}
              onPress={handleFollow}
            >
              {isFollowing ? (
                <UserCheck color="#8B5CF6" size={20} />
              ) : (
                <UserPlus color="#FFFFFF" size={20} />
              )}
              <Text
                style={[
                  styles.followButtonText,
                  isFollowing && styles.followingButtonText,
                ]}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.messageButton}>
              <MessageCircle color="#FFFFFF" size={20} />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
            onPress={() => setActiveTab('posts')}
          >
            <Music
              color={activeTab === 'posts' ? '#8B5CF6' : 'rgba(255, 255, 255, 0.6)'}
              size={20}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'posts' && styles.tabTextActive,
              ]}
            >
              Posts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'likes' && styles.tabActive]}
            onPress={() => setActiveTab('likes')}
          >
            <Heart
              color={activeTab === 'likes' ? '#8B5CF6' : 'rgba(255, 255, 255, 0.6)'}
              size={20}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'likes' && styles.tabTextActive,
              ]}
            >
              Likes
            </Text>
          </TouchableOpacity>
        </View>

        {/* Posts Grid */}
        <View style={styles.postsContainer}>
          {posts.map((post, index) => (
            <Animated.View
              key={post.id}
              entering={FadeInDown.delay(index * 50)}
            >
              <PostCard post={post} onLike={() => handleLike(post.id)} />
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function PostCard({ post, onLike }: { post: Post; onLike: () => void }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => router.push(`/social/post/${post.id}`)}
      activeOpacity={0.9}
    >
      <Text style={styles.postContent}>{post.content}</Text>

      {post.track && (
        <View style={styles.trackAttachment}>
          <View style={styles.trackCover}>
            <Music color="#8B5CF6" size={20} />
          </View>
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {post.track.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {post.track.artist}
            </Text>
          </View>
          <TouchableOpacity style={styles.playButton}>
            <Play color="#FFFFFF" size={14} fill="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.postActionButton} onPress={onLike}>
          <Heart
            color={post.liked ? '#EF4444' : 'rgba(255, 255, 255, 0.6)'}
            size={18}
            fill={post.liked ? '#EF4444' : 'none'}
          />
          <Text style={styles.postActionText}>{post.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.postActionButton}>
          <MessageCircle color="rgba(255, 255, 255, 0.6)" size={18} />
          <Text style={styles.postActionText}>{post.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.postActionButton}>
          <Share2 color="rgba(255, 255, 255, 0.6)" size={18} />
          <Text style={styles.postActionText}>{post.shares}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.postTimestamp}>{post.timestamp}</Text>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerPosts: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  infoContainer: {
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  username: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  followButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
  },
  followingButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  followingButtonText: {
    color: '#8B5CF6',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  tabTextActive: {
    color: '#8B5CF6',
  },
  postsContainer: {
    padding: 20,
  },
  postCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  postContent: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  playButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postActions: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 8,
  },
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postActionText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  postTimestamp: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});

