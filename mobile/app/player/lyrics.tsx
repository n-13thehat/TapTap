import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated as RNAnimated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Music,
  ChevronDown,
  Share2,
  Type,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface LyricLine {
  time: number; // seconds
  text: string;
}

export default function LyricsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [autoScroll, setAutoScroll] = useState(true);

  // Mock lyrics data - replace with API call
  const lyrics: LyricLine[] = [
    { time: 0, text: 'In the silence of the night' },
    { time: 5, text: 'Stars are shining bright' },
    { time: 10, text: 'Dreams are taking flight' },
    { time: 15, text: 'In the midnight light' },
    { time: 20, text: '' },
    { time: 22, text: 'Midnight dreams, calling me' },
    { time: 27, text: 'Through the darkness, I can see' },
    { time: 32, text: 'A world of endless possibility' },
    { time: 37, text: 'In my midnight dreams' },
    { time: 42, text: '' },
    { time: 45, text: 'Shadows dance across the floor' },
    { time: 50, text: 'Whispers echo through the door' },
    { time: 55, text: 'Searching for something more' },
    { time: 60, text: 'In this midnight lore' },
    { time: 65, text: '' },
    { time: 67, text: 'Midnight dreams, calling me' },
    { time: 72, text: 'Through the darkness, I can see' },
    { time: 77, text: 'A world of endless possibility' },
    { time: 82, text: 'In my midnight dreams' },
    { time: 87, text: '' },
    { time: 90, text: 'When the morning comes around' },
    { time: 95, text: 'And my feet touch the ground' },
    { time: 100, text: "I'll remember what I found" },
    { time: 105, text: 'In that midnight sound' },
    { time: 110, text: '' },
    { time: 112, text: 'Midnight dreams, calling me' },
    { time: 117, text: 'Through the darkness, I can see' },
    { time: 122, text: 'A world of endless possibility' },
    { time: 127, text: 'In my midnight dreams' },
    { time: 132, text: '' },
    { time: 135, text: 'In my midnight dreams...' },
  ];

  const track = {
    title: 'Midnight Dreams',
    artist: 'Luna Eclipse',
    duration: 225, // 3:45 in seconds
  };

  // Simulate playback progress
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= track.duration) {
          clearInterval(interval);
          return track.duration;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to current lyric
  useEffect(() => {
    if (autoScroll && scrollViewRef.current) {
      const currentIndex = lyrics.findIndex(
        (line, index) =>
          currentTime >= line.time &&
          (index === lyrics.length - 1 || currentTime < lyrics[index + 1].time)
      );

      if (currentIndex >= 0) {
        scrollViewRef.current.scrollTo({
          y: currentIndex * 60,
          animated: true,
        });
      }
    }
  }, [currentTime, autoScroll]);

  const handleFontSizeChange = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFontSize((prev) => Math.max(14, Math.min(28, prev + delta)));
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Implement share functionality
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
          <ChevronDown color="#FFFFFF" size={28} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={styles.headerArtist} numberOfLines={1}>
            {track.artist}
          </Text>
        </View>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Share2 color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setAutoScroll(!autoScroll)}
        >
          <Text
            style={[
              styles.controlButtonText,
              autoScroll && styles.controlButtonTextActive,
            ]}
          >
            Auto-scroll {autoScroll ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>

        <View style={styles.fontControls}>
          <TouchableOpacity
            style={styles.fontButton}
            onPress={() => handleFontSizeChange(-2)}
          >
            <Type color="#FFFFFF" size={16} />
            <Text style={styles.fontButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.fontSizeText}>{fontSize}</Text>
          <TouchableOpacity
            style={styles.fontButton}
            onPress={() => handleFontSizeChange(2)}
          >
            <Type color="#FFFFFF" size={20} />
            <Text style={styles.fontButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lyrics */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.lyricsContainer}
        contentContainerStyle={styles.lyricsContent}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setAutoScroll(false)}
      >
        <View style={styles.topSpacer} />
        {lyrics.map((line, index) => {
          const isActive =
            currentTime >= line.time &&
            (index === lyrics.length - 1 ||
              currentTime < lyrics[index + 1].time);
          const isPast = currentTime > line.time && !isActive;
          const isFuture = currentTime < line.time;

          return (
            <LyricLine
              key={index}
              text={line.text}
              isActive={isActive}
              isPast={isPast}
              isFuture={isFuture}
              fontSize={fontSize}
            />
          );
        })}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(currentTime / track.duration) * 100}%` },
            ]}
          />
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>
            {formatTime(currentTime)}
          </Text>
          <Text style={styles.timeText}>
            {formatTime(track.duration)}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function LyricLine({
  text,
  isActive,
  isPast,
  isFuture,
  fontSize,
}: {
  text: string;
  isActive: boolean;
  isPast: boolean;
  isFuture: boolean;
  fontSize: number;
}) {
  const opacity = useRef(new RNAnimated.Value(isFuture ? 0.3 : isPast ? 0.5 : 1)).current;
  const scale = useRef(new RNAnimated.Value(isActive ? 1.05 : 1)).current;

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(opacity, {
        toValue: isFuture ? 0.3 : isPast ? 0.5 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
      RNAnimated.spring(scale, {
        toValue: isActive ? 1.05 : 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
    ]).start();
  }, [isActive, isPast, isFuture]);

  if (!text) {
    return <View style={styles.emptyLine} />;
  }

  return (
    <RNAnimated.View
      style={[
        styles.lyricLine,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <Text
        style={[
          styles.lyricText,
          { fontSize },
          isActive && styles.lyricTextActive,
        ]}
      >
        {text}
      </Text>
      {isActive && (
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.3)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.activeGradient}
        />
      )}
    </RNAnimated.View>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerArtist: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  controlButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  controlButtonTextActive: {
    color: '#8B5CF6',
  },
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fontButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
  },
  fontButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fontSizeText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    minWidth: 24,
    textAlign: 'center',
  },
  lyricsContainer: {
    flex: 1,
  },
  lyricsContent: {
    paddingHorizontal: 20,
  },
  topSpacer: {
    height: 100,
  },
  bottomSpacer: {
    height: 200,
  },
  lyricLine: {
    paddingVertical: 12,
    position: 'relative',
  },
  lyricText: {
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 32,
    textAlign: 'center',
  },
  lyricTextActive: {
    fontWeight: '700',
    color: '#8B5CF6',
  },
  activeGradient: {
    position: 'absolute',
    left: -20,
    right: -20,
    top: 0,
    bottom: 0,
    zIndex: -1,
  },
  emptyLine: {
    height: 24,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

