import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  MoreVertical,
  Send,
  Music,
  Play,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    verified: boolean;
  };
  content: string;
  likes: number;
  liked: boolean;
  timestamp: string;
  replies?: Comment[];
}

export default function PostDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Mock post data
  const post = {
    id: params.id as string,
    author: {
      id: '1',
      name: 'Luna Eclipse',
      verified: true,
    },
    content: 'Just dropped my new track "Midnight Dreams" 🌙✨ What do you think?',
    track: {
      id: '1',
      title: 'Midnight Dreams',
      artist: 'Luna Eclipse',
    },
    likes: 1234,
    comments: 89,
    shares: 45,
    liked: false,
    timestamp: '2h ago',
  };

  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: { id: '2', name: 'Neon Pulse', verified: true },
      content: 'This is fire! 🔥 Love the vibes',
      likes: 45,
      liked: false,
      timestamp: '1h ago',
      replies: [
        {
          id: '1-1',
          author: { id: '1', name: 'Luna Eclipse', verified: true },
          content: 'Thank you! 🙏',
          likes: 12,
          liked: false,
          timestamp: '45m ago',
        },
      ],
    },
    {
      id: '2',
      author: { id: '3', name: 'Star Voyager', verified: false },
      content: 'The production quality is insane! How did you get that synth sound?',
      likes: 23,
      liked: true,
      timestamp: '30m ago',
    },
  ]);

  const handleSendComment = () => {
    if (!commentText.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const newComment: Comment = {
      id: Date.now().toString(),
      author: {
        id: 'current-user',
        name: 'You',
        verified: false,
      },
      content: commentText,
      likes: 0,
      liked: false,
      timestamp: 'Just now',
    };

    setComments([...comments, newComment]);
    setCommentText('');
    setReplyingTo(null);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleLikeComment = (commentId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setComments(comments.map(comment => 
      comment.id === commentId
        ? { ...comment, liked: !comment.liked, likes: comment.liked ? comment.likes - 1 : comment.likes + 1 }
        : comment
    ));
  };

  return (
    <LinearGradient
      colors={['#000000', '#1a0033', '#000000']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={0}
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
          <Text style={styles.headerTitle}>Post</Text>
          <TouchableOpacity style={styles.moreButton}>
            <MoreVertical color="#FFFFFF" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Post */}
          <View style={styles.postContainer}>
            {/* Author */}
            <View style={styles.authorSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {post.author.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.authorInfo}>
                <View style={styles.authorNameRow}>
                  <Text style={styles.authorName}>{post.author.name}</Text>
                  {post.author.verified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.timestamp}>{post.timestamp}</Text>
              </View>
            </View>

            {/* Content */}
            <Text style={styles.postContent}>{post.content}</Text>

            {/* Track Attachment */}
            {post.track && (
              <TouchableOpacity style={styles.trackAttachment}>
                <View style={styles.trackCover}>
                  <Music color="#8B5CF6" size={24} />
                </View>
                <View style={styles.trackInfo}>
                  <Text style={styles.trackTitle}>{post.track.title}</Text>
                  <Text style={styles.trackArtist}>{post.track.artist}</Text>
                </View>
                <TouchableOpacity style={styles.playButton}>
                  <Play color="#FFFFFF" size={16} fill="#FFFFFF" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}

            {/* Stats */}
            <View style={styles.stats}>
              <Text style={styles.statText}>{post.likes} likes</Text>
              <Text style={styles.statText}>{post.comments} comments</Text>
              <Text style={styles.statText}>{post.shares} shares</Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionButton}>
                <Heart
                  color={post.liked ? '#EF4444' : 'rgba(255, 255, 255, 0.6)'}
                  size={22}
                  fill={post.liked ? '#EF4444' : 'none'}
                />
                <Text style={styles.actionText}>Like</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MessageCircle color="rgba(255, 255, 255, 0.6)" size={22} />
                <Text style={styles.actionText}>Comment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Share2 color="rgba(255, 255, 255, 0.6)" size={22} />
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              Comments ({comments.length})
            </Text>

            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onLike={() => handleLikeComment(comment.id)}
                onReply={() => setReplyingTo(comment.id)}
              />
            ))}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          {replyingTo && (
            <View style={styles.replyingBanner}>
              <Text style={styles.replyingText}>
                Replying to {comments.find(c => c.id === replyingTo)?.author.name}
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Text style={styles.cancelReply}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.commentInputRow}>
            <View style={styles.commentAvatar}>
              <Text style={styles.commentAvatarText}>Y</Text>
            </View>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !commentText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSendComment}
              disabled={!commentText.trim()}
            >
              <Send
                color={commentText.trim() ? '#8B5CF6' : 'rgba(255, 255, 255, 0.3)'}
                size={20}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function CommentCard({
  comment,
  onLike,
  onReply,
  isReply = false,
}: {
  comment: Comment;
  onLike: () => void;
  onReply: () => void;
  isReply?: boolean;
}) {
  return (
    <View style={[styles.commentCard, isReply && styles.replyCard]}>
      <View style={styles.commentAvatar}>
        <Text style={styles.commentAvatarText}>
          {comment.author.name.charAt(0)}
        </Text>
      </View>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <View style={styles.commentAuthorRow}>
            <Text style={styles.commentAuthor}>{comment.author.name}</Text>
            {comment.author.verified && (
              <View style={styles.verifiedBadgeSmall}>
                <Text style={styles.verifiedTextSmall}>✓</Text>
              </View>
            )}
          </View>
          <Text style={styles.commentTimestamp}>{comment.timestamp}</Text>
        </View>
        <Text style={styles.commentText}>{comment.content}</Text>
        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.commentActionButton}
            onPress={onLike}
          >
            <Heart
              color={comment.liked ? '#EF4444' : 'rgba(255, 255, 255, 0.5)'}
              size={14}
              fill={comment.liked ? '#EF4444' : 'none'}
            />
            <Text style={styles.commentActionText}>{comment.likes}</Text>
          </TouchableOpacity>
          {!isReply && (
            <TouchableOpacity
              style={styles.commentActionButton}
              onPress={onReply}
            >
              <Text style={styles.commentActionText}>Reply</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {comment.replies.map((reply) => (
              <CommentCard
                key={reply.id}
                comment={reply}
                onLike={() => {}}
                onReply={() => {}}
                isReply
              />
            ))}
          </View>
        )}
      </View>
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
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  postContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  postContent: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 16,
  },
  trackAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginBottom: 16,
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
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  commentsSection: {
    padding: 20,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  commentCard: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  replyCard: {
    marginLeft: 40,
    marginTop: 12,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifiedBadgeSmall: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedTextSmall: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  commentTimestamp: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  commentText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  repliesContainer: {
    marginTop: 12,
  },
  bottomSpacer: {
    height: 100,
  },
  commentInputContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  replyingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  replyingText: {
    fontSize: 12,
    color: '#8B5CF6',
  },
  cancelReply: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

