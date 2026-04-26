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
  Bell,
  Share2,
  Music,
  Play,
  Eye,
  ThumbsUp,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface Video {
  id: string;
  title: string;
  views: number;
  likes: number;
  duration: string;
  uploadDate: string;
}

export default function ChannelScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState<'videos' | 'about'>('videos');

  const channel = {
    id: params.id as string,
    name: 'Luna Eclipse',
    verified: true,
    subscribers: 125000,
    totalViews: 5600000,
    videoCount: 89,
    description: 'Electronic music producer creating midnight vibes ✨\n\nNew music every week!\n\nFor business inquiries: contact@lunaeclipse.com',
    joinedDate: 'Joined Jan 2024',
  };

  const videos: Video[] = [
    {
      id: '1',
      title: 'Midnight Dreams - Official Music Video',
      views: 1234567,
      likes: 45678,
      duration: '3:45',
      uploadDate: '2 days ago',
    },
    {
      id: '2',
      title: 'Behind The Scenes: Making of Midnight Dreams',
      views: 567890,
      likes: 23456,
      duration: '8:12',
      uploadDate: '1 week ago',
    },
    {
      id: '3',
      title: 'Live Studio Session - New Track Preview',
      views: 890123,
      likes: 34567,
      duration: '15:30',
      uploadDate: '2 weeks ago',
    },
  ];

  const handleSubscribe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubscribed(!isSubscribed);
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
        <Text style={styles.headerTitle}>{channel.name}</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Share2 color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Channel Banner */}
        <View style={styles.bannerSection}>
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            style={styles.banner}
          >
            <Music color="#FFFFFF" size={60} />
          </LinearGradient>
        </View>

        {/* Channel Info */}
        <View style={styles.infoSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {channel.name.charAt(0)}
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.channelName}>{channel.name}</Text>
            {channel.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            )}
          </View>

          <Text style={styles.subscriberCount}>
            {(channel.subscribers / 1000).toFixed(0)}K subscribers • {channel.videoCount} videos
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.subscribeButton,
                isSubscribed && styles.subscribedButton,
              ]}
              onPress={handleSubscribe}
            >
              <Text
                style={[
                  styles.subscribeButtonText,
                  isSubscribed && styles.subscribedButtonText,
                ]}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bellButton}>
              <Bell color={isSubscribed ? '#8B5CF6' : 'rgba(255, 255, 255, 0.6)'} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {(channel.totalViews / 1000000).toFixed(1)}M
            </Text>
            <Text style={styles.statLabel}>Total Views</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{channel.videoCount}</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {(channel.subscribers / 1000).toFixed(0)}K
            </Text>
            <Text style={styles.statLabel}>Subscribers</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'videos' && styles.tabActive]}
            onPress={() => setActiveTab('videos')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'videos' && styles.tabTextActive,
              ]}
            >
              Videos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' && styles.tabActive]}
            onPress={() => setActiveTab('about')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'about' && styles.tabTextActive,
              ]}
            >
              About
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'videos' ? (
          <View style={styles.videosSection}>
            {videos.map((video, index) => (
              <Animated.View
                key={video.id}
                entering={FadeInDown.delay(index * 50)}
              >
                <VideoCard video={video} />
              </Animated.View>
            ))}
          </View>
        ) : (
          <View style={styles.aboutSection}>
            <Text style={styles.aboutTitle}>Description</Text>
            <Text style={styles.aboutText}>{channel.description}</Text>
            
            <Text style={styles.aboutTitle}>Channel Details</Text>
            <Text style={styles.aboutText}>{channel.joinedDate}</Text>
            <Text style={styles.aboutText}>
              {channel.totalViews.toLocaleString()} total views
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </LinearGradient>
  );
}

function VideoCard({ video }: { video: Video }) {
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
      <View style={styles.videoThumbnail}>
        <Music color="#8B5CF6" size={32} />
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{video.duration}</Text>
        </View>
        <View style={styles.playOverlay}>
          <Play color="#FFFFFF" size={24} fill="#FFFFFF" />
        </View>
      </View>

      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {video.title}
        </Text>
        <View style={styles.videoStats}>
          <View style={styles.videoStat}>
            <Eye color="rgba(255, 255, 255, 0.5)" size={14} />
            <Text style={styles.videoStatText}>
              {video.views.toLocaleString()}
            </Text>
          </View>
          <View style={styles.videoStat}>
            <ThumbsUp color="rgba(255, 255, 255, 0.5)" size={14} />
            <Text style={styles.videoStatText}>
              {video.likes.toLocaleString()}
            </Text>
          </View>
        </View>
        <Text style={styles.uploadDate}>{video.uploadDate}</Text>
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
  bannerSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  banner: {
    height: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  avatarContainer: {
    marginTop: -40,
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#000000',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  channelName: {
    fontSize: 24,
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
  subscriberCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  subscribeButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
  },
  subscribedButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  subscribeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subscribedButtonText: {
    color: '#8B5CF6',
  },
  bellButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
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
  videosSection: {
    padding: 20,
  },
  videoCard: {
    marginBottom: 20,
  },
  videoThumbnail: {
    height: 200,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playOverlay: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {},
  videoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 22,
  },
  videoStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  videoStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  videoStatText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  uploadDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  aboutSection: {
    padding: 20,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    marginTop: 20,
  },
  aboutText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
    marginBottom: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});

