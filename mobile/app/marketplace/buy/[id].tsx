import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Music,
  Wallet,
  CreditCard,
  Check,
  AlertCircle,
  ShoppingCart,
  DollarSign,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function PurchaseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [quantity, setQuantity] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const track = {
    id: params.id as string,
    title: 'Midnight Dreams',
    artist: 'Luna Eclipse',
    priceTap: 500,
    priceUsd: 50,
    available: 766,
  };

  const walletBalance = 2500; // TAP
  const totalPrice = parseInt(quantity || '0') * track.priceTap;
  const canPurchase = 
    parseInt(quantity) > 0 &&
    parseInt(quantity) <= track.available &&
    totalPrice <= walletBalance &&
    agreedToTerms;

  const handlePurchase = async () => {
    if (!canPurchase) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsPurchasing(true);

    // Simulate purchase
    setTimeout(() => {
      setIsPurchasing(false);
      Alert.alert(
        'Purchase Successful! 🎉',
        `You now own ${quantity} copy(ies) of "${track.title}"`,
        [
          {
            text: 'View My Purchases',
            onPress: () => router.push('/marketplace/purchases'),
          },
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    }, 2000);
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
          <X color="#FFFFFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Purchase</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Track Info */}
        <View style={styles.trackSection}>
          <View style={styles.trackCover}>
            <Music color="#8B5CF6" size={40} />
          </View>
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle}>{track.title}</Text>
            <Text style={styles.trackArtist}>{track.artist}</Text>
            <Text style={styles.trackPrice}>{track.priceTap} TAP each</Text>
          </View>
        </View>

        {/* Quantity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => {
                const newQty = Math.max(1, parseInt(quantity || '1') - 1);
                setQuantity(newQty.toString());
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.quantityInput}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              maxLength={4}
            />
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => {
                const newQty = Math.min(track.available, parseInt(quantity || '1') + 1);
                setQuantity(newQty.toString());
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.availableText}>
            {track.available} available
          </Text>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'wallet' && styles.paymentOptionActive,
            ]}
            onPress={() => {
              setPaymentMethod('wallet');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={styles.paymentOptionLeft}>
              <View style={[
                styles.radio,
                paymentMethod === 'wallet' && styles.radioActive,
              ]}>
                {paymentMethod === 'wallet' && (
                  <View style={styles.radioDot} />
                )}
              </View>
              <Wallet color="#8B5CF6" size={24} />
              <View>
                <Text style={styles.paymentOptionTitle}>TAP Wallet</Text>
                <Text style={styles.paymentOptionSubtitle}>
                  Balance: {walletBalance} TAP
                </Text>
              </View>
            </View>
            {paymentMethod === 'wallet' && (
              <Check color="#8B5CF6" size={20} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'card' && styles.paymentOptionActive,
            ]}
            onPress={() => {
              setPaymentMethod('card');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={styles.paymentOptionLeft}>
              <View style={[
                styles.radio,
                paymentMethod === 'card' && styles.radioActive,
              ]}>
                {paymentMethod === 'card' && (
                  <View style={styles.radioDot} />
                )}
              </View>
              <CreditCard color="#8B5CF6" size={24} />
              <View>
                <Text style={styles.paymentOptionTitle}>Credit Card</Text>
                <Text style={styles.paymentOptionSubtitle}>
                  Pay with USD
                </Text>
              </View>
            </View>
            {paymentMethod === 'card' && (
              <Check color="#8B5CF6" size={20} />
            )}
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <SummaryRow label="Price per NFT" value={`${track.priceTap} TAP`} />
            <SummaryRow label="Quantity" value={quantity} />
            <SummaryRow label="Platform Fee (2.5%)" value={`${Math.round(totalPrice * 0.025)} TAP`} />
            <View style={styles.divider} />
            <SummaryRow
              label="Total"
              value={`${Math.round(totalPrice * 1.025)} TAP`}
              isTotal
            />
            <Text style={styles.summaryUsd}>
              ≈ ${Math.round(totalPrice * 1.025 * 0.1)} USD
            </Text>
          </View>
        </View>

        {/* Warnings */}
        {totalPrice > walletBalance && (
          <View style={styles.warningCard}>
            <AlertCircle color="#EF4444" size={20} />
            <Text style={styles.warningText}>
              Insufficient balance. You need {totalPrice - walletBalance} more TAP.
            </Text>
          </View>
        )}

        {/* Terms */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => {
              setAgreedToTerms(!agreedToTerms);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={[
              styles.checkbox,
              agreedToTerms && styles.checkboxActive,
            ]}>
              {agreedToTerms && (
                <Check color="#FFFFFF" size={16} />
              )}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>NFT Purchase Agreement</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 What you'll get:</Text>
          <Text style={styles.infoText}>• Ownership of {quantity} NFT(s)</Text>
          <Text style={styles.infoText}>• {track.title} by {track.artist}</Text>
          <Text style={styles.infoText}>• 10% royalties on resales</Text>
          <Text style={styles.infoText}>• Exclusive holder benefits</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Purchase Button */}
      <View style={styles.purchaseSection}>
        <TouchableOpacity
          style={[
            styles.purchaseButton,
            !canPurchase && styles.purchaseButtonDisabled,
          ]}
          onPress={handlePurchase}
          disabled={!canPurchase || isPurchasing}
        >
          <ShoppingCart color="#FFFFFF" size={24} />
          <Text style={styles.purchaseButtonText}>
            {isPurchasing
              ? 'Processing...'
              : `Purchase for ${Math.round(totalPrice * 1.025)} TAP`}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

function SummaryRow({ label, value, isTotal = false }: { label: string; value: string; isTotal?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, isTotal && styles.summaryLabelTotal]}>
        {label}
      </Text>
      <Text style={[styles.summaryValue, isTotal && styles.summaryValueTotal]}>
        {value}
      </Text>
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
  closeButton: {
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
  trackSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  trackCover: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  trackPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  quantityInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  availableText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  paymentOptionActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: '#8B5CF6',
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: '#8B5CF6',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8B5CF6',
  },
  paymentOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  paymentOptionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  summaryLabelTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  summaryUsd: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'right',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
    lineHeight: 18,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  termsLink: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  infoCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
    marginBottom: 6,
  },
  bottomSpacer: {
    height: 120,
  },
  purchaseSection: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
  },
  purchaseButtonDisabled: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

