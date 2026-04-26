import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download,
  MoreVertical,
  Music,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function VideoPlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(225); // 3:45

  const video = {
    id: params.id as string,
    title: 'Midnight Dreams - Official Music Video',
    channel: {
      id: '1',
      name: 'Luna Eclipse',
      verified: true,
      subscribers: 125000,
    },
    views: 1234567,
    likes: 45678,
    dislikes: 234,
    uploadDate: '2 days ago',
    description: 'Official music video for "Midnight Dreams" from the upcoming EP "Nocturnal Vibes". \n\nDirected by: Alex Vision\nProduced by: Luna Eclipse\n\nStream on all platforms: https://taptap.io/midnight-dreams',
    tags: ['Electronic', 'Music Video', 'Synthwave', 'Midnight'],
  };

  const relatedVideos = [
    {
      id: '2',
      title: 'Electric Soul - Behind The Scenes',
      channel: 'Neon Pulse',
      views: 89000,
      duration: '5:23',
    },
    {
      id: '3',
      title: 'Cosmic Waves - Live Performance',
      channel: 'Star Voyager',
      views: 156000,
      duration: '4:12',
    },
  ];

  const handlePlayPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPlaying(!isPlaying);
  };

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLiked(!isLiked);
    if (isDisliked) setIsDisliked(false);
  };

  const handleDislike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsDisliked(!isDisliked);
    if (isLiked) setIsLiked(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <LinearGradient
      colors={['#000000', '#1a0033', '#000000']}
      style={styles.container}
    >
      {/* Video Player */}
      <View style={styles.videoContainer}>
        <LinearGradient
          colors={['#8B5CF6', '#EC4899']}
          style={styles.videoPlayer}
        >
          <Music color="#FFFFFF" size={60} />
          
          {/* Play/Pause Overlay */}
          <TouchableOpacity
            style={styles.playOverlay}
            onPress={handlePlayPause}
          >
            {!isPlaying && (
              <View style={styles.playButton}>
                <Play color="#FFFFFF" size={40} fill="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
            >
              <ArrowLeft color="#FFFFFF" size={24} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton}>
              <MoreVertical color="#FFFFFF" size={24} />
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(currentTime / duration) * 100}%` },
                ]}
              />
            </View>
            <View style={styles.controlsRow}>
              <TouchableOpacity onPress={handlePlayPause}>
                {isPlaying ? (
                  <Pause color="#FFFFFF" size={28} />
                ) : (
                  <Play color="#FFFFFF" size={28} fill="#FFFFFF" />
                )}
              </TouchableOpacity>
              <Text style={styles.timeText}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>
              <View style={styles.rightControls}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsMuted(!isMuted);
                  }}
                >
                  {isMuted ? (
                    <VolumeX color="#FFFFFF" size={24} />
                  ) : (
                    <Volume2 color="#FFFFFF" size={24} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity>
                  <Maximize color="#FFFFFF" size={24} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Video Info */}
        <View style={styles.infoSection}>
          <Text style={styles.videoTitle}>{video.title}</Text>
          <Text style={styles.videoStats}>
            {video.views.toLocaleString()} views • {video.uploadDate}
          </Text>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLike}
            >
              <ThumbsUp
                color={isLiked ? '#8B5CF6' : 'rgba(255, 255, 255, 0.7)'}
                size={22}
                fill={isLiked ? '#8B5CF6' : 'none'}
              />
              <Text style={[
                styles.actionText,
                isLiked && styles.actionTextActive,
              ]}>
                {(video.likes + (isLiked ? 1 : 0)).toLocaleString()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDislike}
            >
              <ThumbsDown
                color={isDisliked ? '#EF4444' : 'rgba(255, 255, 255, 0.7)'}
                size={22}
                fill={isDisliked ? '#EF4444' : 'none'}
              />
              <Text style={[
                styles.actionText,
                isDisliked && styles.actionTextDisliked,
              ]}>
                Dislike
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Share2 color="rgba(255, 255, 255, 0.7)" size={22} />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Download color="rgba(255, 255, 255, 0.7)" size={22} />
              <Text style={styles.actionText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Channel Info */}
        <View style={styles.channelSection}>
          <TouchableOpacity
            style={styles.channelRow}
            onPress={() => router.push(`/surf/channel/${video.channel.id}`)}
          >
            <View style={styles.channelAvatar}>
              <Text style={styles.channelAvatarText}>
                {video.channel.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.channelInfo}>
              <View style={styles.channelNameRow}>
                <Text style={styles.channelName}>{video.channel.name}</Text>
                {video.channel.verified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={styles.subscriberCount}>
                {(video.channel.subscribers / 1000).toFixed(0)}K subscribers
              </Text>
            </View>
            <TouchableOpacity style={styles.subscribeButton}>
              <Text style={styles.subscribeButtonText}>Subscribe</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description} numberOfLines={3}>
              {video.description}
            </Text>
            <TouchableOpacity>
              <Text style={styles.showMore}>Show more</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.tagsSection}>
          {video.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        {/* Related Videos */}
        <View style={styles.relatedSection}>
          <Text style={styles.sectionTitle}>Related Videos</Text>
          {relatedVideos.map((relatedVideo) => (
            <TouchableOpacity
              key={relatedVideo.id}
              style={styles.relatedVideoCard}
              onPress={() => router.push(`/surf/watch/${relatedVideo.id}`)}
            >
              <View style={styles.relatedThumbnail}>
                <Music color="#8B5CF6" size={24} />
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{relatedVideo.duration}</Text>
                </View>
              </View>
              <View style={styles.relatedInfo}>
                <Text style={styles.relatedTitle} numberOfLines={2}>
                  {relatedVideo.title}
                </Text>
                <Text style={styles.relatedChannel}>{relatedVideo.channel}</Text>
                <Text style={styles.relatedViews}>
                  {relatedVideo.views.toLocaleString()} views
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoContainer: {
    width: width,
    height: width * 9 / 16, // 16:9 aspect ratio
    backgroundColor: '#000000',
  },
  videoPlayer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1.5,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 1.5,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rightControls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 24,
  },
  videoStats: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  actionTextActive: {
    color: '#8B5CF6',
  },
  actionTextDisliked: {
    color: '#EF4444',
  },
  channelSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  channelAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  channelInfo: {
    flex: 1,
  },
  channelNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  channelName: {
    fontSize: 15,
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
  subscriberCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  subscribeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
  },
  subscribeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  descriptionContainer: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  description: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: 8,
  },
  showMore: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  relatedSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  relatedVideoCard: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  relatedThumbnail: {
    width: 160,
    height: 90,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  durationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  relatedInfo: {
    flex: 1,
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 18,
  },
  relatedChannel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 2,
  },
  relatedViews: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  bottomSpacer: {
    height: 40,
  },
});

