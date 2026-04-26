import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Image as ImageIcon,
  Music,
  Video,
  Smile,
  AtSign,
  Hash,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function CreatePostScreen() {
  const router = useRouter();
  const [postText, setPostText] = useState('');
  const [attachedTrack, setAttachedTrack] = useState<any>(null);
  const [isPosting, setIsPosting] = useState(false);

  const handlePost = async () => {
    if (!postText.trim() && !attachedTrack) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPosting(true);

    // Simulate API call
    setTimeout(() => {
      setIsPosting(false);
      router.back();
    }, 1000);
  };

  const handleAttachTrack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Mock track attachment
    setAttachedTrack({
      id: '1',
      title: 'Midnight Dreams',
      artist: 'Luna Eclipse',
    });
  };

  const handleRemoveTrack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAttachedTrack(null);
  };

  const canPost = postText.trim().length > 0 || attachedTrack !== null;

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
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity
            style={[
              styles.postButton,
              !canPost && styles.postButtonDisabled,
            ]}
            onPress={handlePost}
            disabled={!canPost || isPosting}
          >
            <Text
              style={[
                styles.postButtonText,
                !canPost && styles.postButtonTextDisabled,
              ]}
            >
              {isPosting ? 'Posting...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Author */}
          <View style={styles.authorSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>Y</Text>
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>You</Text>
              <Text style={styles.authorUsername}>@you</Text>
            </View>
          </View>

          {/* Text Input */}
          <TextInput
            style={styles.textInput}
            placeholder="What's on your mind?"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={postText}
            onChangeText={setPostText}
            multiline
            autoFocus
            maxLength={500}
          />

          {/* Character Count */}
          <View style={styles.characterCount}>
            <Text
              style={[
                styles.characterCountText,
                postText.length > 450 && styles.characterCountWarning,
                postText.length >= 500 && styles.characterCountError,
              ]}
            >
              {postText.length}/500
            </Text>
          </View>

          {/* Attached Track */}
          {attachedTrack && (
            <View style={styles.attachedTrack}>
              <View style={styles.trackCover}>
                <Music color="#8B5CF6" size={24} />
              </View>
              <View style={styles.trackInfo}>
                <Text style={styles.trackTitle}>{attachedTrack.title}</Text>
                <Text style={styles.trackArtist}>{attachedTrack.artist}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeTrackButton}
                onPress={handleRemoveTrack}
              >
                <X color="rgba(255, 255, 255, 0.6)" size={20} />
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity style={styles.quickActionButton}>
                <AtSign color="#8B5CF6" size={20} />
                <Text style={styles.quickActionText}>Mention</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton}>
                <Hash color="#8B5CF6" size={20} />
                <Text style={styles.quickActionText}>Hashtag</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton}>
                <Smile color="#8B5CF6" size={20} />
                <Text style={styles.quickActionText}>Emoji</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>💡 Tips for great posts:</Text>
            <Text style={styles.tipText}>• Share your music journey</Text>
            <Text style={styles.tipText}>• Attach tracks to get more engagement</Text>
            <Text style={styles.tipText}>• Use hashtags to reach more people</Text>
            <Text style={styles.tipText}>• Mention artists to start conversations</Text>
          </View>
        </ScrollView>

        {/* Bottom Toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolbarButton}>
            <ImageIcon color="rgba(255, 255, 255, 0.6)" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarButton}>
            <Video color="rgba(255, 255, 255, 0.6)" size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={handleAttachTrack}
          >
            <Music color="#8B5CF6" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarButton}>
            <Smile color="rgba(255, 255, 255, 0.6)" size={24} />
          </TouchableOpacity>
        </View>
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
  postButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
  },
  postButtonDisabled: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  postButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  postButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  authorUsername: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  textInput: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 16,
  },
  characterCountText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  characterCountWarning: {
    color: '#F59E0B',
  },
  characterCountError: {
    color: '#EF4444',
  },
  attachedTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginBottom: 20,
  },
  trackCover: {
    width: 48,
    height: 48,
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
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  removeTrackButton: {
    padding: 8,
  },
  quickActions: {
    marginBottom: 24,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  tipsSection: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
    marginBottom: 6,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  toolbarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

