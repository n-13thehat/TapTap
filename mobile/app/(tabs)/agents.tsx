import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FlashList } from '@shopify/flash-list';
import { Sparkles, ChevronRight } from 'lucide-react-native';
import { useAgents } from '../../hooks/useAgents';
import { Agent } from '../../types';

export default function AgentsScreen() {
  const router = useRouter();
  const { agents, loading, error } = useAgents();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading agents...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load agents</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#000000', '#1a0033', '#000000']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Sparkles color="#8B5CF6" size={32} />
          <Text style={styles.headerTitle}>AI Agents</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {agents.length} agents ready to assist you
        </Text>
      </View>

      {/* Agent List */}
      <FlashList
        data={agents}
        estimatedItemSize={100}
        renderItem={({ item }) => (
          <AgentCard
            agent={item}
            onPress={() => router.push(`/agents/chat?agentId=${item.id}`)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </LinearGradient>
  );
}

function AgentCard({ agent, onPress }: { agent: Agent; onPress: () => void }) {
  const theme = agent.meta?.theme || {};
  const color = theme.color || '#8B5CF6';
  const emoji = theme.emoji || '✨';

  return (
    <TouchableOpacity
      style={styles.agentCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={[`${color}15`, `${color}05`]}
        style={styles.agentCardGradient}
      >
        <View style={styles.agentCardContent}>
          {/* Agent Icon */}
          <View
            style={[
              styles.agentIcon,
              { backgroundColor: `${color}30`, borderColor: `${color}50` },
            ]}
          >
            <Text style={styles.agentEmoji}>{emoji}</Text>
          </View>

          {/* Agent Info */}
          <View style={styles.agentInfo}>
            <Text style={styles.agentName}>{agent.name}</Text>
            <Text style={styles.agentRole}>{agent.role}</Text>
            <Text style={styles.agentSignature} numberOfLines={1}>
              "{agent.signature}"
            </Text>
          </View>

          {/* Arrow */}
          <ChevronRight color="rgba(255, 255, 255, 0.4)" size={24} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
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
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorSubtext: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 44,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  agentCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  agentCardGradient: {
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 16,
  },
  agentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  agentIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  agentEmoji: {
    fontSize: 28,
  },
  agentInfo: {
    flex: 1,
    gap: 4,
  },
  agentName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  agentRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  agentSignature: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
});

