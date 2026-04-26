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
  X,
  Play,
  GripVertical,
  Trash2,
  Music,
  Shuffle,
  RotateCcw,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface QueueTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  isPlaying: boolean;
}

export default function QueueScreen() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueTrack[]>([
    {
      id: '1',
      title: 'Midnight Dreams',
      artist: 'Luna Eclipse',
      duration: '3:45',
      isPlaying: true,
    },
    {
      id: '2',
      title: 'Electric Soul',
      artist: 'Neon Pulse',
      duration: '4:12',
      isPlaying: false,
    },
    {
      id: '3',
      title: 'Cosmic Waves',
      artist: 'Star Voyager',
      duration: '5:30',
      isPlaying: false,
    },
    {
      id: '4',
      title: 'Neon Nights',
      artist: 'Cyber Dreams',
      duration: '3:58',
      isPlaying: false,
    },
    {
      id: '5',
      title: 'Digital Love',
      artist: 'Synth Wave',
      duration: '4:25',
      isPlaying: false,
    },
  ]);

  const [history, setHistory] = useState<QueueTrack[]>([
    {
      id: '0',
      title: 'Starlight',
      artist: 'Nova Sound',
      duration: '3:20',
      isPlaying: false,
    },
  ]);

  const handleRemoveFromQueue = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setQueue(queue.filter(track => track.id !== id));
  };

  const handlePlayTrack = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQueue(queue.map(track => ({
      ...track,
      isPlaying: track.id === id,
    })));
  };

  const handleClearQueue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setQueue(queue.filter(track => track.isPlaying));
  };

  const handleShuffle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const currentTrack = queue.find(t => t.isPlaying);
    const otherTracks = queue.filter(t => !t.isPlaying);
    const shuffled = otherTracks.sort(() => Math.random() - 0.5);
    setQueue(currentTrack ? [currentTrack, ...shuffled] : shuffled);
  };

  return (
    <LinearGradient
      colors={['#000000', '#1a0033', '#000000']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <X color="#FFFFFF" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Queue</Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearQueue}
        >
          <Trash2 color="#EF4444" size={24} />
        </TouchableOpacity>
      </View>

      {/* Queue Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{queue.length}</Text>
          <Text style={styles.statLabel}>tracks in queue</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {queue.reduce((acc, track) => {
              const [min, sec] = track.duration.split(':').map(Number);
              return acc + min * 60 + sec;
            }, 0) / 60 | 0}
          </Text>
          <Text style={styles.statLabel}>minutes total</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleShuffle}
        >
          <Shuffle color="#8B5CF6" size={20} />
          <Text style={styles.actionButtonText}>Shuffle</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Now Playing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Now Playing</Text>
          {queue.filter(t => t.isPlaying).map((track, index) => (
            <Animated.View
              key={track.id}
              entering={FadeInDown.delay(index * 50)}
            >
              <NowPlayingCard track={track} />
            </Animated.View>
          ))}
        </View>

        {/* Up Next */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Up Next ({queue.filter(t => !t.isPlaying).length})
          </Text>
          <FlashList
            data={queue.filter(t => !t.isPlaying)}
            estimatedItemSize={80}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(index * 50)}>
                <QueueTrackCard
                  track={item}
                  onPlay={() => handlePlayTrack(item.id)}
                  onRemove={() => handleRemoveFromQueue(item.id)}
                />
              </Animated.View>
            )}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>

        {/* History */}
        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recently Played</Text>
            {history.map((track, index) => (
              <Animated.View
                key={track.id}
                entering={FadeInDown.delay(index * 50)}
              >
                <HistoryTrackCard
                  track={track}
                  onPlay={() => handlePlayTrack(track.id)}
                />
              </Animated.View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </LinearGradient>
  );
}

function NowPlayingCard({ track }: { track: QueueTrack }) {
  return (
    <View style={styles.nowPlayingCard}>
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.3)', 'rgba(139, 92, 246, 0.1)']}
        style={styles.nowPlayingGradient}
      >
        <View style={styles.nowPlayingCover}>
          <Music color="#8B5CF6" size={32} />
        </View>
        <View style={styles.nowPlayingInfo}>
          <View style={styles.nowPlayingBadge}>
            <Play color="#FFFFFF" size={12} fill="#FFFFFF" />
            <Text style={styles.nowPlayingBadgeText}>NOW PLAYING</Text>
          </View>
          <Text style={styles.nowPlayingTitle}>{track.title}</Text>
          <Text style={styles.nowPlayingArtist}>{track.artist}</Text>
        </View>
        <Text style={styles.nowPlayingDuration}>{track.duration}</Text>
      </LinearGradient>
    </View>
  );
}

function QueueTrackCard({
  track,
  onPlay,
  onRemove,
}: {
  track: QueueTrack;
  onPlay: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.queueTrackCard}>
      <TouchableOpacity style={styles.dragHandle}>
        <GripVertical color="rgba(255, 255, 255, 0.3)" size={20} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.queueTrackContent}
        onPress={onPlay}
        activeOpacity={0.7}
      >
        <View style={styles.queueTrackCover}>
          <Music color="#8B5CF6" size={20} />
        </View>
        <View style={styles.queueTrackInfo}>
          <Text style={styles.queueTrackTitle} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={styles.queueTrackArtist} numberOfLines={1}>
            {track.artist}
          </Text>
        </View>
        <Text style={styles.queueTrackDuration}>{track.duration}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={onRemove}
      >
        <X color="rgba(255, 255, 255, 0.5)" size={20} />
      </TouchableOpacity>
    </View>
  );
}

function HistoryTrackCard({
  track,
  onPlay,
}: {
  track: QueueTrack;
  onPlay: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.historyTrackCard}
      onPress={onPlay}
      activeOpacity={0.7}
    >
      <View style={styles.historyTrackCover}>
        <RotateCcw color="rgba(139, 92, 246, 0.5)" size={16} />
      </View>
      <View style={styles.historyTrackInfo}>
        <Text style={styles.historyTrackTitle} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.historyTrackArtist} numberOfLines={1}>
          {track.artist}
        </Text>
      </View>
      <Text style={styles.historyTrackDuration}>{track.duration}</Text>
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
    paddingBottom: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  clearButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  nowPlayingCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  nowPlayingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
    borderRadius: 16,
  },
  nowPlayingCover: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  nowPlayingInfo: {
    flex: 1,
  },
  nowPlayingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  nowPlayingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  nowPlayingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  nowPlayingArtist: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  nowPlayingDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  queueTrackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  dragHandle: {
    padding: 8,
    marginRight: 8,
  },
  queueTrackContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  queueTrackCover: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  queueTrackInfo: {
    flex: 1,
  },
  queueTrackTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  queueTrackArtist: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  queueTrackDuration: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 12,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  historyTrackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    opacity: 0.6,
  },
  historyTrackCover: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyTrackInfo: {
    flex: 1,
  },
  historyTrackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  historyTrackArtist: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  historyTrackDuration: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  bottomSpacer: {
    height: 100,
  },
});

