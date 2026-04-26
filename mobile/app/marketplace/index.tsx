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
  ShoppingBag,
  Search,
  TrendingUp,
  Filter,
  Play,
  DollarSign,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface NFTTrack {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  priceTap: number;
  priceSol: number;
  priceUsd: number;
  owners: number;
  trending: boolean;
}

export default function MarketplaceScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [listings, setListings] = useState<NFTTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'trending' | 'new'>('all');

  useEffect(() => {
    loadListings();
  }, [filter]);

  async function loadListings() {
    // Mock data
    const mockListings: NFTTrack[] = [
      {
        id: '1',
        title: 'Midnight Dreams',
        artist: 'Luna Eclipse',
        priceTap: 500,
        priceSol: 0.5,
        priceUsd: 50,
        owners: 234,
        trending: true,
      },
      {
        id: '2',
        title: 'Electric Soul',
        artist: 'Neon Pulse',
        priceTap: 750,
        priceSol: 0.75,
        priceUsd: 75,
        owners: 189,
        trending: false,
      },
    ];
    setListings(mockListings);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadListings();
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
          <ShoppingBag color="#8B5CF6" size={32} />
          <Text style={styles.headerTitle}>Marketplace</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search color="rgba(255, 255, 255, 0.4)" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tracks..."
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
          style={[styles.filterTab, filter === 'new' && styles.filterTabActive]}
          onPress={() => setFilter('new')}
        >
          <Text style={[styles.filterText, filter === 'new' && styles.filterTextActive]}>
            New
          </Text>
        </TouchableOpacity>
      </View>

      {/* Listings */}
      <FlashList
        data={listings}
        estimatedItemSize={200}
        numColumns={2}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50)} style={styles.cardWrapper}>
            <NFTTrackCard track={item} />
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

function NFTTrackCard({ track }: { track: NFTTrack }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.nftCard}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/marketplace/track/${track.id}`);
      }}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.05)']}
        style={styles.nftCardGradient}
      >
        {/* Cover */}
        <View style={styles.nftCover}>
          <Play color="#8B5CF6" size={32} fill="#8B5CF6" />
          {track.trending && (
            <View style={styles.trendingBadge}>
              <TrendingUp color="#FFFFFF" size={12} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.nftInfo}>
          <Text style={styles.nftTitle} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={styles.nftArtist} numberOfLines={1}>
            {track.artist}
          </Text>
        </View>

        {/* Price */}
        <View style={styles.nftPrice}>
          <DollarSign color="#10B981" size={16} />
          <Text style={styles.nftPriceText}>{track.priceTap} TAP</Text>
        </View>

        {/* Owners */}
        <Text style={styles.nftOwners}>{track.owners} owners</Text>
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
  filterButton: {
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
  cardWrapper: {
    width: '50%',
    padding: 6,
  },
  nftCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  nftCardGradient: {
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 16,
  },
  nftCover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  trendingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nftInfo: {
    marginBottom: 8,
  },
  nftTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  nftArtist: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  nftPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  nftPriceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  nftOwners: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

