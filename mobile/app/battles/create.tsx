import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Trophy,
  Clock,
  Music,
  Plus,
  Trash2,
  Play,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface SelectedTrack {
  id: string;
  title: string;
  artist: string;
}

export default function CreateBattleScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prizePool, setPrizePool] = useState('');
  const [duration, setDuration] = useState('24');
  const [selectedTracks, setSelectedTracks] = useState<SelectedTrack[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleAddTrack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Mock track selection
    const mockTrack: SelectedTrack = {
      id: Date.now().toString(),
      title: 'Sample Track',
      artist: 'Sample Artist',
    };
    setSelectedTracks([...selectedTracks, mockTrack]);
  };

  const handleRemoveTrack = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedTracks(selectedTracks.filter(t => t.id !== id));
  };

  const handleCreate = async () => {
    if (!canCreate) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsCreating(true);

    // Simulate API call
    setTimeout(() => {
      setIsCreating(false);
      router.back();
    }, 1500);
  };

  const canCreate = title.trim() && description.trim() && prizePool && selectedTracks.length >= 2;

  return (
    <LinearGradient
      colors={['#000000', '#1a0033', '#000000']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
          <Text style={styles.headerTitle}>Create Battle</Text>
          <TouchableOpacity
            style={[
              styles.createButton,
              !canCreate && styles.createButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={!canCreate || isCreating}
          >
            <Text
              style={[
                styles.createButtonText,
                !canCreate && styles.createButtonTextDisabled,
              ]}
            >
              {isCreating ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Battle Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Battle Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Best Electronic Track"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
              <Text style={styles.charCount}>{title.length}/100</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your battle..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.charCount}>{description.length}/500</Text>
            </View>
          </View>

          {/* Prize & Duration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prize & Duration</Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Prize Pool (TAP) *</Text>
                <View style={styles.inputWithIcon}>
                  <Trophy color="#F59E0B" size={20} />
                  <TextInput
                    style={styles.inputWithIconText}
                    placeholder="5000"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={prizePool}
                    onChangeText={setPrizePool}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Duration (hours) *</Text>
                <View style={styles.inputWithIcon}>
                  <Clock color="#8B5CF6" size={20} />
                  <TextInput
                    style={styles.inputWithIconText}
                    placeholder="24"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={duration}
                    onChangeText={setDuration}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <View style={styles.durationPresets}>
              {['12', '24', '48', '72'].map((hours) => (
                <TouchableOpacity
                  key={hours}
                  style={[
                    styles.presetButton,
                    duration === hours && styles.presetButtonActive,
                  ]}
                  onPress={() => setDuration(hours)}
                >
                  <Text
                    style={[
                      styles.presetButtonText,
                      duration === hours && styles.presetButtonTextActive,
                    ]}
                  >
                    {hours}h
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tracks */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Competing Tracks ({selectedTracks.length})
              </Text>
              <Text style={styles.sectionSubtitle}>Minimum 2 tracks required</Text>
            </View>

            {selectedTracks.map((track) => (
              <View key={track.id} style={styles.trackCard}>
                <View style={styles.trackCover}>
                  <Music color="#8B5CF6" size={20} />
                </View>
                <View style={styles.trackInfo}>
                  <Text style={styles.trackTitle}>{track.title}</Text>
                  <Text style={styles.trackArtist}>{track.artist}</Text>
                </View>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => {}}
                >
                  <Play color="#FFFFFF" size={14} fill="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveTrack(track.id)}
                >
                  <Trash2 color="#EF4444" size={18} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addTrackButton}
              onPress={handleAddTrack}
            >
              <Plus color="#8B5CF6" size={24} />
              <Text style={styles.addTrackButtonText}>Add Track</Text>
            </TouchableOpacity>
          </View>

          {/* Rules */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Battle Rules</Text>
            <View style={styles.rulesCard}>
              <RuleItem text="One vote per user" />
              <RuleItem text="Winner announced when battle ends" />
              <RuleItem text="Prize distributed within 24 hours" />
              <RuleItem text="Minimum 2 tracks required" />
              <RuleItem text="Battle cannot be cancelled once started" />
            </View>
          </View>

          {/* Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preview</Text>
            <View style={styles.previewCard}>
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.05)']}
                style={styles.previewGradient}
              >
                <Text style={styles.previewTitle}>
                  {title || 'Battle Title'}
                </Text>
                <Text style={styles.previewDescription}>
                  {description || 'Battle description will appear here...'}
                </Text>
                <View style={styles.previewStats}>
                  <View style={styles.previewStat}>
                    <Trophy color="#F59E0B" size={16} />
                    <Text style={styles.previewStatText}>
                      {prizePool || '0'} TAP
                    </Text>
                  </View>
                  <View style={styles.previewStat}>
                    <Clock color="#8B5CF6" size={16} />
                    <Text style={styles.previewStatText}>
                      {duration || '0'}h
                    </Text>
                  </View>
                  <View style={styles.previewStat}>
                    <Music color="#8B5CF6" size={16} />
                    <Text style={styles.previewStatText}>
                      {selectedTracks.length} tracks
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function RuleItem({ text }: { text: string }) {
  return (
    <View style={styles.ruleItem}>
      <View style={styles.ruleBullet} />
      <Text style={styles.ruleText}>{text}</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
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
  createButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
  },
  createButtonDisabled: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  createButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'right',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWithIconText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  durationPresets: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: '#8B5CF6',
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  presetButtonTextActive: {
    color: '#8B5CF6',
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    padding: 8,
  },
  addTrackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderStyle: 'dashed',
  },
  addTrackButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  rulesCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  ruleBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8B5CF6',
    marginTop: 7,
  },
  ruleText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  previewCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
    marginBottom: 16,
  },
  previewStats: {
    flexDirection: 'row',
    gap: 16,
  },
  previewStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewStatText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  bottomSpacer: {
    height: 40,
  },
});

