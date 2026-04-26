import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Play,
  Heart,
  Share2,
  ShoppingCart,
  Users,
  TrendingUp,
  Clock,
  DollarSign,
  Music,
  BarChart3,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function TrackDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isLiked, setIsLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const track = {
    id: params.id as string,
    title: 'Midnight Dreams',
    artist: {
      id: '1',
      name: 'Luna Eclipse',
      verified: true,
    },
    priceTap: 500,
    priceSol: 0.5,
    priceUsd: 50,
    owners: 234,
    totalSupply: 1000,
    available: 766,
    trending: true,
    duration: '3:45',
    releaseDate: 'Jan 5, 2026',
    genre: 'Electronic',
    bpm: 128,
    key: 'A Minor',
    description: 'A mesmerizing journey through midnight soundscapes. This track combines ethereal synths with deep basslines to create an unforgettable listening experience.',
    royalties: 10,
    priceHistory: [
      { date: 'Jan 1', price: 450 },
      { date: 'Jan 2', price: 470 },
      { date: 'Jan 3', price: 480 },
      { date: 'Jan 4', price: 490 },
      { date: 'Jan 5', price: 500 },
    ],
  };

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLiked(!isLiked);
  };

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPlaying(!isPlaying);
  };

  const handleBuy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push(`/marketplace/buy/${track.id}`);
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
        <Text style={styles.headerTitle}>Track Details</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Share2 color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Art */}
        <View style={styles.coverSection}>
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            style={styles.coverArt}
          >
            <Music color="#FFFFFF" size={80} />
            {track.trending && (
              <View style={styles.trendingBadge}>
                <TrendingUp color="#FFFFFF" size={16} />
                <Text style={styles.trendingText}>Trending</Text>
              </View>
            )}
          </LinearGradient>

          {/* Play Button */}
          <TouchableOpacity
            style={styles.playButtonLarge}
            onPress={handlePlay}
          >
            <Play
              color="#FFFFFF"
              size={32}
              fill={isPlaying ? '#FFFFFF' : 'none'}
            />
          </TouchableOpacity>
        </View>

        {/* Track Info */}
        <View style={styles.infoSection}>
          <Text style={styles.trackTitle}>{track.title}</Text>
          <View style={styles.artistRow}>
            <Text style={styles.artistName}>{track.artist.name}</Text>
            {track.artist.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLike}
            >
              <Heart
                color={isLiked ? '#EF4444' : 'rgba(255, 255, 255, 0.6)'}
                size={24}
                fill={isLiked ? '#EF4444' : 'none'}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Share2 color="rgba(255, 255, 255, 0.6)" size={24} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Price Card */}
        <View style={styles.priceSection}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.05)']}
            style={styles.priceCard}
          >
            <View style={styles.priceHeader}>
              <Text style={styles.priceLabel}>Current Price</Text>
              <View style={styles.priceChange}>
                <TrendingUp color="#10B981" size={16} />
                <Text style={styles.priceChangeText}>+5.2%</Text>
              </View>
            </View>
            <View style={styles.priceRow}>
              <DollarSign color="#10B981" size={32} />
              <Text style={styles.priceValue}>{track.priceTap} TAP</Text>
            </View>
            <Text style={styles.priceUsd}>≈ ${track.priceUsd} USD</Text>

            <View style={styles.priceStats}>
              <View style={styles.priceStat}>
                <Users color="rgba(255, 255, 255, 0.6)" size={16} />
                <Text style={styles.priceStatText}>{track.owners} owners</Text>
              </View>
              <View style={styles.priceStat}>
                <Music color="rgba(255, 255, 255, 0.6)" size={16} />
                <Text style={styles.priceStatText}>
                  {track.available}/{track.totalSupply} available
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <StatCard icon={Clock} label="Duration" value={track.duration} />
            <StatCard icon={Music} label="Genre" value={track.genre} />
            <StatCard icon={BarChart3} label="BPM" value={track.bpm.toString()} />
            <StatCard icon={Music} label="Key" value={track.key} />
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{track.description}</Text>
        </View>

        {/* Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Details</Text>
          <DetailRow label="Release Date" value={track.releaseDate} />
          <DetailRow label="Royalties" value={`${track.royalties}%`} />
          <DetailRow label="Total Supply" value={track.totalSupply.toString()} />
          <DetailRow label="Available" value={track.available.toString()} />
        </View>

        {/* Price History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Price History</Text>
          <View style={styles.chart}>
            {track.priceHistory.map((point, index) => (
              <View key={index} style={styles.chartBar}>
                <View
                  style={[
                    styles.chartBarFill,
                    { height: `${(point.price / 500) * 100}%` },
                  ]}
                />
                <Text style={styles.chartLabel}>{point.date.split(' ')[1]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Buy Button */}
      <View style={styles.buySection}>
        <TouchableOpacity style={styles.buyButton} onPress={handleBuy}>
          <ShoppingCart color="#FFFFFF" size={24} />
          <Text style={styles.buyButtonText}>Buy for {track.priceTap} TAP</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Icon color="#8B5CF6" size={20} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  coverSection: {
    alignItems: 'center',
    paddingVertical: 32,
    position: 'relative',
  },
  coverArt: {
    width: 280,
    height: 280,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  trendingBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
  },
  trendingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playButtonLarge: {
    position: 'absolute',
    bottom: 16,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  trackTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  artistName: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  priceCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  priceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceChangeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  priceValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  priceUsd: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
  },
  priceStats: {
    flexDirection: 'row',
    gap: 20,
  },
  priceStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceStatText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  descriptionSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
  },
  detailsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  historySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: 20,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 4,
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
    minHeight: 20,
  },
  chartLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 8,
  },
  bottomSpacer: {
    height: 100,
  },
  buySection: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

