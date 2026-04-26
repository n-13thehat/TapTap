import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, ArrowLeft, Loader2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAgent } from '../../hooks/useAgent';
import { useChat } from '../../hooks/useChat';

export default function AgentChatScreen() {
  const { agentId } = useLocalSearchParams<{ agentId: string }>();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const { agent, loading: agentLoading } = useAgent(agentId);
  const { messages, sendMessage, loading: chatLoading } = useChat(agentId);
  
  const [input, setInput] = useState('');

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || chatLoading) return;

    const message = input.trim();
    setInput('');
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    await sendMessage(message);
  };

  if (agentLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  if (!agent) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Agent not found</Text>
      </View>
    );
  }

  const theme = agent.meta?.theme || {};
  const color = theme.color || '#8B5CF6';
  const emoji = theme.emoji || '✨';

  return (
    <LinearGradient
      colors={['#000000', '#1a0033', '#000000']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown} style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft color="#FFFFFF" size={24} />
          </TouchableOpacity>
          
          <View style={styles.headerAgent}>
            <View
              style={[
                styles.headerAgentIcon,
                { backgroundColor: `${color}30`, borderColor: `${color}50` },
              ]}
            >
              <Text style={styles.headerAgentEmoji}>{emoji}</Text>
            </View>
            <View>
              <Text style={styles.headerAgentName}>{agent.name}</Text>
              <Text style={styles.headerAgentRole}>{agent.role}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <Animated.View entering={FadeInUp} style={styles.emptyState}>
              <View
                style={[
                  styles.emptyStateIcon,
                  { backgroundColor: `${color}20`, borderColor: `${color}40` },
                ]}
              >
                <Text style={styles.emptyStateEmoji}>{emoji}</Text>
              </View>
              <Text style={styles.emptyStateTitle}>Chat with {agent.name}</Text>
              <Text style={styles.emptyStateSubtitle}>{agent.summary}</Text>
              <Text style={styles.emptyStateSignature}>"{agent.signature}"</Text>
            </Animated.View>
          )}

          {messages.map((message, index) => (
            <Animated.View
              key={message.id}
              entering={FadeInUp.delay(index * 50)}
            >
              <MessageBubble
                message={message}
                agentColor={color}
                agentEmoji={emoji}
                agentName={agent.name}
              />
            </Animated.View>
          ))}

          {chatLoading && (
            <Animated.View entering={FadeInUp} style={styles.typingIndicator}>
              <View style={[styles.typingBubble, { backgroundColor: `${color}20` }]}>
                <Loader2 color={color} size={16} />
                <Text style={styles.typingText}>{agent.name} is typing...</Text>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* Input */}
        <Animated.View entering={FadeInUp} style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={`Message ${agent.name}...`}
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!input.trim() || chatLoading}
              style={[
                styles.sendButton,
                { backgroundColor: input.trim() ? color : 'rgba(139, 92, 246, 0.3)' },
              ]}
            >
              <Send color="#FFFFFF" size={20} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function MessageBubble({ message, agentColor, agentEmoji, agentName }: any) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.messageBubble, isUser && styles.messageBubbleUser]}>
      {!isUser && (
        <View style={[styles.messageIcon, { backgroundColor: `${agentColor}30` }]}>
          <Text style={styles.messageIconEmoji}>{agentEmoji}</Text>
        </View>
      )}
      
      <View
        style={[
          styles.messageContent,
          isUser
            ? styles.messageContentUser
            : [styles.messageContentAgent, { backgroundColor: `${agentColor}20` }],
        ]}
      >
        {!isUser && (
          <Text style={styles.messageName}>{agentName}</Text>
        )}
        <Text style={styles.messageText}>{message.content}</Text>
        <Text style={styles.messageTime}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 18,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)',
  },
  backButton: {
    marginRight: 16,
  },
  headerAgent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAgentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  headerAgentEmoji: {
    fontSize: 24,
  },
  headerAgentName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerAgentRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 16,
  },
  emptyStateEmoji: {
    fontSize: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 40,
  },
  emptyStateSignature: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  messageBubbleUser: {
    justifyContent: 'flex-end',
  },
  messageIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageIconEmoji: {
    fontSize: 16,
  },
  messageContent: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
  },
  messageContentUser: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderTopRightRadius: 4,
  },
  messageContentAgent: {
    borderTopLeftRadius: 4,
  },
  messageName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 4,
  },
  typingIndicator: {
    marginBottom: 16,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  typingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.2)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

