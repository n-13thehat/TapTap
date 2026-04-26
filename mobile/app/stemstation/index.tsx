import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FlashList } from '@shopify/flash-list';
import {
  Music,
  Search,
  Sliders,
  Play,
  Volume2,
  VolumeX,
  Radio,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  stems: {
    drums: boolean;
    bass: boolean;
    vocals: boolean;
    melody: boolean;
  };
  remixes: number;
}

export default function StemStationScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'popular' | 'recent'>('all');

  useEffect(() => {
    loadTracks();
  }, [filter]);

  async function loadTracks() {
    // Mock data - replace with API call
    const mockTracks: Track[] = [
      {
        id: '1',
        title: 'Midnight Dreams',
        artist: 'Luna Eclipse',
        duration: '3:45',
        stems: {
          drums: true,
          bass: true,
          vocals: true,
          melody: true,
        },
        remixes: 234,
      },
      {
        id: '2',
        title: 'Electric Soul',
        artist: 'Neon Pulse',
        duration: '4:12',
        stems: {
          drums: true,
          bass: true,
          vocals: true,
          melody: true,
        },
        remixes: 189,
      },
      {
        id: '3',
        title: 'Cosmic Waves',
        artist: 'Star Voyager',
        duration: '5:30',
        stems: {
          drums: true,
          bass: true,
          vocals: false,
          melody: true,
        },
        remixes: 456,
      },
    ];
    setTracks(mockTracks);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadTracks();
    setRefreshing(false);
  }

  return (
    <LinearGradient
      colors={['#000000', '#1a0033', '#000000']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sliders color="#8B5CF6" size={32} />
          <Text style={styles.headerTitle}>StemStation</Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Radio color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search color="rgba(255, 255, 255, 0.4)" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tracks with stems..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.05)']}
          style={styles.infoBannerGradient}
        >
          <Sliders color="#8B5CF6" size={20} />
          <Text style={styles.infoBannerText}>
            Separate tracks into stems and create your own remixes
          </Text>
        </LinearGradient>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All Tracks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'popular' && styles.filterTabActive]}
          onPress={() => setFilter('popular')}
        >
          <Text style={[styles.filterText, filter === 'popular' && styles.filterTextActive]}>
            Popular
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'recent' && styles.filterTabActive]}
          onPress={() => setFilter('recent')}
        >
          <Text style={[styles.filterText, filter === 'recent' && styles.filterTextActive]}>
            Recent
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tracks */}
      <FlashList
        data={tracks}
        estimatedItemSize={140}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50)}>
            <TrackCard track={item} />
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

function TrackCard({ track }: { track: Track }) {
  const router = useRouter();

  const stemIcons = [
    { key: 'drums', label: 'Drums', icon: '🥁', available: track.stems.drums },
    { key: 'bass', label: 'Bass', icon: '🎸', available: track.stems.bass },
    { key: 'vocals', label: 'Vocals', icon: '🎤', available: track.stems.vocals },
    { key: 'melody', label: 'Melody', icon: '🎹', available: track.stems.melody },
  ];

  return (
    <TouchableOpacity
      style={styles.trackCard}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/stemstation/editor/${track.id}`);
      }}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.05)']}
        style={styles.trackCardGradient}
      >
        {/* Track Info */}
        <View style={styles.trackHeader}>
          <View style={styles.trackCover}>
            <Music color="#8B5CF6" size={24} />
          </View>
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle}>{track.title}</Text>
            <Text style={styles.trackArtist}>{track.artist}</Text>
            <Text style={styles.trackDuration}>{track.duration}</Text>
          </View>
          <TouchableOpacity style={styles.playButton}>
            <Play color="#FFFFFF" size={20} fill="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Stems Available */}
        <View style={styles.stemsContainer}>
          <Text style={styles.stemsLabel}>Available Stems:</Text>
          <View style={styles.stemsList}>
            {stemIcons.map((stem) => (
              <View
                key={stem.key}
                style={[
                  styles.stemBadge,
                  !stem.available && styles.stemBadgeDisabled,
                ]}
              >
                <Text style={styles.stemIcon}>{stem.icon}</Text>
                <Text
                  style={[
                    styles.stemText,
                    !stem.available && styles.stemTextDisabled,
                  ]}
                >
                  {stem.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Remixes Count */}
        <View style={styles.trackFooter}>
          <View style={styles.remixCount}>
            <Radio color="#8B5CF6" size={16} />
            <Text style={styles.remixText}>{track.remixes} remixes</Text>
          </View>
          <TouchableOpacity style={styles.remixButton}>
            <Sliders color="#8B5CF6" size={16} />
            <Text style={styles.remixButtonText}>Create Remix</Text>
          </TouchableOpacity>
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
  infoBanner: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  infoBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
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
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
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
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  trackDuration: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stemsContainer: {
    marginBottom: 16,
  },
  stemsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  stemsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  stemBadgeDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.5,
  },
  stemIcon: {
    fontSize: 14,
  },
  stemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  stemTextDisabled: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  trackFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remixCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  remixText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  remixButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  remixButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B5CF6',
  },
});

