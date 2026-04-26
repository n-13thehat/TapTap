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
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Save,
  Share2,
  Music,
} from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface Stem {
  id: string;
  name: string;
  icon: string;
  color: string;
  volume: number;
  muted: boolean;
  solo: boolean;
}

export default function StemEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.8);

  const track = {
    id: params.id as string,
    title: 'Midnight Dreams',
    artist: 'Luna Eclipse',
    duration: '3:45',
  };

  const [stems, setStems] = useState<Stem[]>([
    {
      id: '1',
      name: 'Drums',
      icon: '🥁',
      color: '#EF4444',
      volume: 0.8,
      muted: false,
      solo: false,
    },
    {
      id: '2',
      name: 'Bass',
      icon: '🎸',
      color: '#8B5CF6',
      volume: 0.7,
      muted: false,
      solo: false,
    },
    {
      id: '3',
      name: 'Vocals',
      icon: '🎤',
      color: '#EC4899',
      volume: 0.9,
      muted: false,
      solo: false,
    },
    {
      id: '4',
      name: 'Melody',
      icon: '🎹',
      color: '#10B981',
      volume: 0.6,
      muted: false,
      solo: false,
    },
  ]);

  const handlePlayPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (stemId: string, volume: number) => {
    setStems(stems.map(stem =>
      stem.id === stemId ? { ...stem, volume } : stem
    ));
  };

  const handleMute = (stemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStems(stems.map(stem =>
      stem.id === stemId ? { ...stem, muted: !stem.muted } : stem
    ));
  };

  const handleSolo = (stemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStems(stems.map(stem =>
      stem.id === stemId ? { ...stem, solo: !stem.solo } : stem
    ));
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStems(stems.map(stem => ({
      ...stem,
      volume: 0.8,
      muted: false,
      solo: false,
    })));
    setMasterVolume(0.8);
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/stemstation/remix');
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
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{track.title}</Text>
          <Text style={styles.headerSubtitle}>{track.artist}</Text>
        </View>
        <TouchableOpacity style={styles.shareButton}>
          <Share2 color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Waveform Visualization */}
        <View style={styles.waveformSection}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.05)']}
            style={styles.waveform}
          >
            <Music color="#8B5CF6" size={40} />
            <Text style={styles.waveformText}>Waveform Visualization</Text>
          </LinearGradient>
        </View>

        {/* Playback Controls */}
        <View style={styles.controlsSection}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayPause}
          >
            {isPlaying ? (
              <Pause color="#FFFFFF" size={32} />
            ) : (
              <Play color="#FFFFFF" size={32} fill="#FFFFFF" />
            )}
          </TouchableOpacity>
          <View style={styles.timeInfo}>
            <Text style={styles.timeText}>0:00</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '30%' }]} />
            </View>
            <Text style={styles.timeText}>{track.duration}</Text>
          </View>
        </View>

        {/* Master Volume */}
        <View style={styles.masterSection}>
          <Text style={styles.sectionTitle}>Master Volume</Text>
          <View style={styles.masterControl}>
            <Volume2 color="#8B5CF6" size={24} />
            <Slider
              style={styles.masterSlider}
              minimumValue={0}
              maximumValue={1}
              value={masterVolume}
              onValueChange={setMasterVolume}
              minimumTrackTintColor="#8B5CF6"
              maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
              thumbTintColor="#8B5CF6"
            />
            <Text style={styles.volumeValue}>
              {Math.round(masterVolume * 100)}%
            </Text>
          </View>
        </View>

        {/* Stems */}
        <View style={styles.stemsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Stems</Text>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
            >
              <RotateCcw color="#8B5CF6" size={18} />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {stems.map((stem) => (
            <StemControl
              key={stem.id}
              stem={stem}
              onVolumeChange={(volume) => handleVolumeChange(stem.id, volume)}
              onMute={() => handleMute(stem.id)}
              onSolo={() => handleSolo(stem.id)}
            />
          ))}
        </View>

        {/* Effects (Coming Soon) */}
        <View style={styles.effectsSection}>
          <Text style={styles.sectionTitle}>Effects</Text>
          <View style={styles.comingSoonCard}>
            <Text style={styles.comingSoonText}>
              🎛️ Effects coming soon!
            </Text>
            <Text style={styles.comingSoonSubtext}>
              EQ, Reverb, Delay, and more...
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveSection}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Save color="#FFFFFF" size={24} />
          <Text style={styles.saveButtonText}>Save & Create Remix</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

function StemControl({
  stem,
  onVolumeChange,
  onMute,
  onSolo,
}: {
  stem: Stem;
  onVolumeChange: (volume: number) => void;
  onMute: () => void;
  onSolo: () => void;
}) {
  return (
    <View style={styles.stemCard}>
      <View style={styles.stemHeader}>
        <View style={styles.stemInfo}>
          <Text style={styles.stemIcon}>{stem.icon}</Text>
          <Text style={styles.stemName}>{stem.name}</Text>
        </View>
        <View style={styles.stemButtons}>
          <TouchableOpacity
            style={[
              styles.stemButton,
              stem.solo && styles.stemButtonActive,
            ]}
            onPress={onSolo}
          >
            <Text
              style={[
                styles.stemButtonText,
                stem.solo && styles.stemButtonTextActive,
              ]}
            >
              S
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.stemButton,
              stem.muted && styles.stemButtonMuted,
            ]}
            onPress={onMute}
          >
            {stem.muted ? (
              <VolumeX color="#EF4444" size={16} />
            ) : (
              <Volume2 color="rgba(255, 255, 255, 0.6)" size={16} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.stemSliderContainer}>
        <Slider
          style={styles.stemSlider}
          minimumValue={0}
          maximumValue={1}
          value={stem.volume}
          onValueChange={onVolumeChange}
          minimumTrackTintColor={stem.color}
          maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
          thumbTintColor={stem.color}
          disabled={stem.muted}
        />
        <Text style={styles.stemVolumeValue}>
          {Math.round(stem.volume * 100)}%
        </Text>
      </View>

      {/* Visual Level Meter */}
      <View style={styles.levelMeter}>
        <View
          style={[
            styles.levelMeterFill,
            {
              width: stem.muted ? '0%' : `${stem.volume * 100}%`,
              backgroundColor: stem.color,
            },
          ]}
        />
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
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  waveform: {
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
  },
  controlsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#8B5CF6',
  },
  masterSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  masterControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  masterSlider: {
    flex: 1,
  },
  volumeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5CF6',
    width: 45,
    textAlign: 'right',
  },
  stemsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  stemCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  stemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stemIcon: {
    fontSize: 24,
  },
  stemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stemButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  stemButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stemButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  stemButtonMuted: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  stemButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  stemButtonTextActive: {
    color: '#FFFFFF',
  },
  stemSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  stemSlider: {
    flex: 1,
  },
  stemVolumeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    width: 45,
    textAlign: 'right',
  },
  levelMeter: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  levelMeterFill: {
    height: '100%',
    borderRadius: 3,
  },
  effectsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  comingSoonCard: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  bottomSpacer: {
    height: 100,
  },
  saveSection: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

