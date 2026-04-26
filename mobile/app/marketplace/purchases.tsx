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
  Music,
  TrendingUp,
  DollarSign,
  Calendar,
  Share2,
  Play,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface Purchase {
  id: string;
  track: {
    id: string;
    title: string;
    artist: string;
  };
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
  profitLoss: number;
  profitLossPercent: number;
}

export default function MyPurchasesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'profit' | 'loss'>('all');

  const purchases: Purchase[] = [
    {
      id: '1',
      track: {
        id: '1',
        title: 'Midnight Dreams',
        artist: 'Luna Eclipse',
      },
      quantity: 2,
      purchasePrice: 500,
      currentPrice: 550,
      purchaseDate: 'Jan 5, 2026',
      profitLoss: 100,
      profitLossPercent: 10,
    },
    {
      id: '2',
      track: {
        id: '2',
        title: 'Electric Soul',
        artist: 'Neon Pulse',
      },
      quantity: 1,
      purchasePrice: 450,
      currentPrice: 420,
      purchaseDate: 'Jan 3, 2026',
      profitLoss: -30,
      profitLossPercent: -6.7,
    },
    {
      id: '3',
      track: {
        id: '3',
        title: 'Cosmic Waves',
        artist: 'Star Voyager',
      },
      quantity: 3,
      purchasePrice: 380,
      currentPrice: 480,
      purchaseDate: 'Jan 1, 2026',
      profitLoss: 300,
      profitLossPercent: 26.3,
    },
  ];

  const filteredPurchases = purchases.filter(p => {
    if (filter === 'profit') return p.profitLoss > 0;
    if (filter === 'loss') return p.profitLoss < 0;
    return true;
  });

  const totalValue = purchases.reduce((sum, p) => sum + (p.currentPrice * p.quantity), 0);
  const totalInvested = purchases.reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0);
  const totalProfitLoss = totalValue - totalInvested;
  const totalProfitLossPercent = (totalProfitLoss / totalInvested) * 100;

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
        <Text style={styles.headerTitle}>My Purchases</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Portfolio Summary */}
      <View style={styles.summarySection}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.05)']}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryLabel}>Total Portfolio Value</Text>
          <Text style={styles.summaryValue}>{totalValue} TAP</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatLabel}>Invested</Text>
              <Text style={styles.summaryStatValue}>{totalInvested} TAP</Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatLabel}>P/L</Text>
              <Text
                style={[
                  styles.summaryStatValue,
                  totalProfitLoss > 0 ? styles.profit : styles.loss,
                ]}
              >
                {totalProfitLoss > 0 ? '+' : ''}{totalProfitLoss} TAP
                ({totalProfitLossPercent > 0 ? '+' : ''}{totalProfitLossPercent.toFixed(1)}%)
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'profit', 'loss'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterButton,
              filter === f && styles.filterButtonActive,
            ]}
            onPress={() => {
              setFilter(f);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f === 'all' ? 'All' : f === 'profit' ? 'Profit' : 'Loss'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Purchases List */}
      <FlashList
        data={filteredPurchases}
        estimatedItemSize={140}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50)}>
            <PurchaseCard purchase={item} />
          </Animated.View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </LinearGradient>
  );
}

function PurchaseCard({ purchase }: { purchase: Purchase }) {
  const router = useRouter();
  const isProfit = purchase.profitLoss > 0;

  return (
    <TouchableOpacity
      style={styles.purchaseCard}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/marketplace/track/${purchase.track.id}`);
      }}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
        style={styles.purchaseCardGradient}
      >
        {/* Track Info */}
        <View style={styles.purchaseHeader}>
          <View style={styles.trackCover}>
            <Music color="#8B5CF6" size={24} />
          </View>
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle}>{purchase.track.title}</Text>
            <Text style={styles.trackArtist}>{purchase.track.artist}</Text>
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityText}>×{purchase.quantity}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.playButton}>
            <Play color="#FFFFFF" size={16} fill="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Price Info */}
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Purchase Price</Text>
              <Text style={styles.priceValue}>{purchase.purchasePrice} TAP</Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Current Price</Text>
              <Text style={styles.priceValue}>{purchase.currentPrice} TAP</Text>
            </View>
          </View>

          {/* Profit/Loss */}
          <View style={[
            styles.profitLossCard,
            isProfit ? styles.profitCard : styles.lossCard,
          ]}>
            <TrendingUp
              color={isProfit ? '#10B981' : '#EF4444'}
              size={20}
              style={!isProfit && { transform: [{ rotate: '180deg' }] }}
            />
            <View style={styles.profitLossInfo}>
              <Text style={[
                styles.profitLossValue,
                isProfit ? styles.profit : styles.loss,
              ]}>
                {isProfit ? '+' : ''}{purchase.profitLoss} TAP
              </Text>
              <Text style={[
                styles.profitLossPercent,
                isProfit ? styles.profit : styles.loss,
              ]}>
                ({isProfit ? '+' : ''}{purchase.profitLossPercent.toFixed(1)}%)
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.purchaseFooter}>
          <View style={styles.dateInfo}>
            <Calendar color="rgba(255, 255, 255, 0.5)" size={14} />
            <Text style={styles.dateText}>{purchase.purchaseDate}</Text>
          </View>
          <TouchableOpacity style={styles.shareButton}>
            <Share2 color="rgba(255, 255, 255, 0.6)" size={16} />
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
  placeholder: {
    width: 40,
  },
  summarySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 24,
  },
  summaryStat: {
    flex: 1,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
  },
  summaryStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profit: {
    color: '#10B981',
  },
  loss: {
    color: '#EF4444',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: '#8B5CF6',
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
  purchaseCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  purchaseCardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  purchaseHeader: {
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
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
  },
  quantityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  quantityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceSection: {
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  priceItem: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profitLossCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
  },
  profitCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  lossCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  profitLossInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profitLossValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  profitLossPercent: {
    fontSize: 14,
    fontWeight: '600',
  },
  purchaseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  shareButton: {
    padding: 8,
  },
});

