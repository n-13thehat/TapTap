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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Music,
  Upload,
  Check,
  Image as ImageIcon,
  Tag,
  DollarSign,
  Globe,
  Lock,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function RemixStudioScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [mintAsNFT, setMintAsNFT] = useState(false);
  const [nftPrice, setNftPrice] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const originalTrack = {
    title: 'Midnight Dreams',
    artist: 'Luna Eclipse',
  };

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 5) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTags(tags.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your remix');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsPublishing(true);

    // Simulate publishing
    setTimeout(() => {
      setIsPublishing(false);
      Alert.alert(
        'Remix Published! 🎉',
        'Your remix has been published successfully!',
        [
          {
            text: 'View Remix',
            onPress: () => router.push('/stemstation'),
          },
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    }, 2000);
  };

  const canPublish = title.trim() && description.trim();

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
          <Text style={styles.headerTitle}>Publish Remix</Text>
          <TouchableOpacity
            style={[
              styles.publishButton,
              !canPublish && styles.publishButtonDisabled,
            ]}
            onPress={handlePublish}
            disabled={!canPublish || isPublishing}
          >
            <Text
              style={[
                styles.publishButtonText,
                !canPublish && styles.publishButtonTextDisabled,
              ]}
            >
              {isPublishing ? 'Publishing...' : 'Publish'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Original Track Info */}
          <View style={styles.originalSection}>
            <Text style={styles.sectionLabel}>Remix of:</Text>
            <View style={styles.originalCard}>
              <View style={styles.originalCover}>
                <Music color="#8B5CF6" size={24} />
              </View>
              <View style={styles.originalInfo}>
                <Text style={styles.originalTitle}>{originalTrack.title}</Text>
                <Text style={styles.originalArtist}>{originalTrack.artist}</Text>
              </View>
            </View>
          </View>

          {/* Cover Art */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cover Art</Text>
            <TouchableOpacity style={styles.coverUpload}>
              <ImageIcon color="#8B5CF6" size={40} />
              <Text style={styles.coverUploadText}>Upload Cover Art</Text>
              <Text style={styles.coverUploadSubtext}>
                Recommended: 1000x1000px
              </Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Midnight Dreams (Your Name Remix)"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about your remix..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags (Max 5)</Text>
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTag(index)}>
                    <X color="#8B5CF6" size={16} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            {tags.length < 5 && (
              <View style={styles.tagInputContainer}>
                <Tag color="#8B5CF6" size={20} />
                <TextInput
                  style={styles.tagInput}
                  placeholder="Add a tag..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={handleAddTag}
                  returnKeyType="done"
                />
                {tagInput.trim() && (
                  <TouchableOpacity onPress={handleAddTag}>
                    <Check color="#8B5CF6" size={20} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Visibility */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Visibility</Text>
            <View style={styles.visibilityOptions}>
              <TouchableOpacity
                style={[
                  styles.visibilityOption,
                  visibility === 'public' && styles.visibilityOptionActive,
                ]}
                onPress={() => {
                  setVisibility('public');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Globe color={visibility === 'public' ? '#8B5CF6' : 'rgba(255, 255, 255, 0.6)'} size={24} />
                <Text style={[
                  styles.visibilityOptionText,
                  visibility === 'public' && styles.visibilityOptionTextActive,
                ]}>
                  Public
                </Text>
                <Text style={styles.visibilityOptionSubtext}>
                  Everyone can see
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.visibilityOption,
                  visibility === 'private' && styles.visibilityOptionActive,
                ]}
                onPress={() => {
                  setVisibility('private');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Lock color={visibility === 'private' ? '#8B5CF6' : 'rgba(255, 255, 255, 0.6)'} size={24} />
                <Text style={[
                  styles.visibilityOptionText,
                  visibility === 'private' && styles.visibilityOptionTextActive,
                ]}>
                  Private
                </Text>
                <Text style={styles.visibilityOptionSubtext}>
                  Only you can see
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* NFT Options */}
          <View style={styles.section}>
            <View style={styles.nftHeader}>
              <Text style={styles.sectionTitle}>Mint as NFT</Text>
              <TouchableOpacity
                style={[
                  styles.toggle,
                  mintAsNFT && styles.toggleActive,
                ]}
                onPress={() => {
                  setMintAsNFT(!mintAsNFT);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <View style={[
                  styles.toggleThumb,
                  mintAsNFT && styles.toggleThumbActive,
                ]} />
              </TouchableOpacity>
            </View>

            {mintAsNFT && (
              <View style={styles.nftOptions}>
                <Text style={styles.nftLabel}>Price (TAP)</Text>
                <View style={styles.priceInput}>
                  <DollarSign color="#8B5CF6" size={20} />
                  <TextInput
                    style={styles.priceInputText}
                    placeholder="500"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={nftPrice}
                    onChangeText={setNftPrice}
                    keyboardType="numeric"
                  />
                </View>
                <Text style={styles.nftInfo}>
                  💡 Your remix will be available for purchase on the marketplace
                </Text>
              </View>
            )}
          </View>

          {/* Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preview</Text>
            <View style={styles.previewCard}>
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.05)']}
                style={styles.previewGradient}
              >
                <View style={styles.previewCover}>
                  <Music color="#8B5CF6" size={32} />
                </View>
                <Text style={styles.previewTitle}>
                  {title || 'Your Remix Title'}
                </Text>
                <Text style={styles.previewDescription}>
                  {description || 'Your remix description...'}
                </Text>
                {tags.length > 0 && (
                  <View style={styles.previewTags}>
                    {tags.map((tag, index) => (
                      <View key={index} style={styles.previewTag}>
                        <Text style={styles.previewTagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </LinearGradient>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
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
  publishButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
  },
  publishButtonDisabled: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  publishButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  publishButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  originalSection: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  originalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  originalCover: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  originalInfo: {
    flex: 1,
  },
  originalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  originalArtist: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  section: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  coverUpload: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverUploadText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8B5CF6',
    marginTop: 12,
  },
  coverUploadSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  visibilityOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  visibilityOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  visibilityOptionActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: '#8B5CF6',
  },
  visibilityOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
  },
  visibilityOptionTextActive: {
    color: '#8B5CF6',
  },
  visibilityOptionSubtext: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  nftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#8B5CF6',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },
  nftOptions: {},
  nftLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  priceInputText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  nftInfo: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  previewCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 16,
    alignItems: 'center',
  },
  previewCover: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  previewDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 12,
  },
  previewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  previewTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  previewTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  bottomSpacer: {
    height: 40,
  },
});

