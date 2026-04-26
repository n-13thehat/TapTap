import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FlashList } from '@shopify/flash-list';
import {
  Music,
  Search,
  Play,
  Pause,
  Heart,
  MoreVertical,
  ListMusic,
  Album as AlbumIcon,
  User,
  Radio,
  Shuffle,
  Repeat,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAudio } from '../../hooks/useAudio';

type Tab = 'songs' | 'albums' | 'artists' | 'playlists';

export default function MusicScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('songs');
  const [searchQuery, setSearchQuery] = useState('');
  const { currentTrack, isPlaying, play, pause } = useAudio();

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'songs', label: 'Songs', icon: ListMusic },
    { key: 'albums', label: 'Albums', icon: AlbumIcon },
    { key: 'artists', label: 'Artists', icon: User },
    { key: 'playlists', label: 'Playlists', icon: Radio },
  ];

  return (
    <LinearGradient
      colors={['#000000', '#1a0033', '#000000']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Library</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Shuffle color="rgba(255, 255, 255, 0.8)" size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <MoreVertical color="rgba(255, 255, 255, 0.8)" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search color="rgba(255, 255, 255, 0.4)" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your library..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <tab.icon
              color={activeTab === tab.key ? '#8B5CF6' : 'rgba(255, 255, 255, 0.6)'}
              size={18}
            />
            <Text
              style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'songs' && <SongsTab searchQuery={searchQuery} />}
        {activeTab === 'albums' && <AlbumsTab searchQuery={searchQuery} />}
        {activeTab === 'artists' && <ArtistsTab searchQuery={searchQuery} />}
        {activeTab === 'playlists' && <PlaylistsTab searchQuery={searchQuery} />}
      </View>

      {/* Now Playing Bar */}
      {currentTrack && (
        <Animated.View entering={FadeInDown} style={styles.nowPlayingBar}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.3)', 'rgba(139, 92, 246, 0.1)']}
            style={styles.nowPlayingGradient}
          >
            <View style={styles.nowPlayingCover}>
              <Music color="#8B5CF6" size={20} />
            </View>
            <View style={styles.nowPlayingInfo}>
              <Text style={styles.nowPlayingTitle} numberOfLines={1}>
                {currentTrack.title}
              </Text>
              <Text style={styles.nowPlayingArtist} numberOfLines={1}>
                {currentTrack.artist}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.nowPlayingButton}
              onPress={isPlaying ? pause : play}
            >
              {isPlaying ? (
                <Pause color="#FFFFFF" size={24} fill="#FFFFFF" />
              ) : (
                <Play color="#FFFFFF" size={24} fill="#FFFFFF" />
              )}
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}
    </LinearGradient>
  );
}

function SongsTab({ searchQuery }: { searchQuery: string }) {
  const songs = [
    { id: '1', title: 'Midnight Dreams', artist: 'Luna Eclipse', duration: '3:45', liked: true },
    { id: '2', title: 'Electric Soul', artist: 'Neon Pulse', duration: '4:12', liked: false },
    { id: '3', title: 'Cosmic Waves', artist: 'Star Voyager', duration: '5:30', liked: true },
    { id: '4', title: 'Digital Rain', artist: 'Cyber Phoenix', duration: '3:58', liked: false },
    { id: '5', title: 'Neon Nights', artist: 'Luna Eclipse', duration: '4:25', liked: true },
  ];

  const filtered = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <FlashList
      data={filtered}
      estimatedItemSize={72}
      renderItem={({ item, index }) => (
        <Animated.View entering={FadeInDown.delay(index * 30)}>
          <SongItem song={item} />
        </Animated.View>
      )}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
    />
  );
}

function SongItem({ song }: any) {
  return (
    <TouchableOpacity style={styles.songItem} activeOpacity={0.7}>
      <View style={styles.songCover}>
        <Music color="#8B5CF6" size={20} />
      </View>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle}>{song.title}</Text>
        <Text style={styles.songArtist}>{song.artist}</Text>
      </View>
      <Text style={styles.songDuration}>{song.duration}</Text>
      <TouchableOpacity style={styles.songAction}>
        <Heart
          color={song.liked ? '#EF4444' : 'rgba(255, 255, 255, 0.4)'}
          size={20}
          fill={song.liked ? '#EF4444' : 'none'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function AlbumsTab({ searchQuery }: { searchQuery: string }) {
  const albums = [
    { id: '1', title: 'Midnight Collection', artist: 'Luna Eclipse', tracks: 12 },
    { id: '2', title: 'Electric Dreams', artist: 'Neon Pulse', tracks: 10 },
    { id: '3', title: 'Cosmic Journey', artist: 'Star Voyager', tracks: 15 },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.albumGrid}>
        {albums.map((album, index) => (
          <Animated.View key={album.id} entering={FadeInDown.delay(index * 50)}>
            <TouchableOpacity style={styles.albumCard} activeOpacity={0.7}>
              <View style={styles.albumCover}>
                <AlbumIcon color="#8B5CF6" size={40} />
              </View>
              <Text style={styles.albumTitle} numberOfLines={1}>
                {album.title}
              </Text>
              <Text style={styles.albumArtist} numberOfLines={1}>
                {album.artist}
              </Text>
              <Text style={styles.albumTracks}>{album.tracks} tracks</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );
}

function ArtistsTab({ searchQuery }: { searchQuery: string }) {
  const artists = [
    { id: '1', name: 'Luna Eclipse', tracks: 24, followers: '45K' },
    { id: '2', name: 'Neon Pulse', tracks: 18, followers: '32K' },
    { id: '3', name: 'Star Voyager', tracks: 31, followers: '67K' },
  ];

  return (
    <FlashList
      data={artists}
      estimatedItemSize={80}
      renderItem={({ item, index }) => (
        <Animated.View entering={FadeInDown.delay(index * 30)}>
          <TouchableOpacity style={styles.artistItem} activeOpacity={0.7}>
            <View style={styles.artistAvatar}>
              <User color="#8B5CF6" size={28} />
            </View>
            <View style={styles.artistInfo}>
              <Text style={styles.artistName}>{item.name}</Text>
              <Text style={styles.artistStats}>
                {item.tracks} tracks • {item.followers} followers
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
    />
  );
}

function PlaylistsTab({ searchQuery }: { searchQuery: string }) {
  const playlists = [
    { id: '1', name: 'Chill Vibes', tracks: 45, duration: '3h 12m' },
    { id: '2', name: 'Workout Mix', tracks: 32, duration: '2h 45m' },
    { id: '3', name: 'Focus Flow', tracks: 28, duration: '2h 15m' },
  ];

  return (
    <FlashList
      data={playlists}
      estimatedItemSize={80}
      renderItem={({ item, index }) => (
        <Animated.View entering={FadeInDown.delay(index * 30)}>
          <TouchableOpacity style={styles.playlistItem} activeOpacity={0.7}>
            <View style={styles.playlistCover}>
              <Radio color="#8B5CF6" size={28} />
            </View>
            <View style={styles.playlistInfo}>
              <Text style={styles.playlistName}>{item.name}</Text>
              <Text style={styles.playlistStats}>
                {item.tracks} tracks • {item.duration}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
    />
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  tabsContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  tabsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
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
  tabActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  tabTextActive: {
    color: '#8B5CF6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  songCover: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  songDuration: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    marginRight: 12,
  },
  songAction: {
    padding: 4,
  },
  albumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  albumCard: {
    width: '47%',
  },
  albumCover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  albumTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  albumArtist: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  albumTracks: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  artistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  artistAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  artistStats: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  playlistCover: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  playlistStats: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  nowPlayingBar: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  nowPlayingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  nowPlayingCover: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nowPlayingInfo: {
    flex: 1,
  },
  nowPlayingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  nowPlayingArtist: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  nowPlayingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

