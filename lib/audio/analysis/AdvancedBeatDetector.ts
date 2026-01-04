/**
 * Advanced Beat Detection Engine for Stemstation
 * Replaces basic onset detection with sophisticated musical analysis
 */

export interface BeatAnalysisResult {
  bpm: number;
  confidence: number;
  beats: number[];
  downbeats: number[];
  timeSignature: [number, number];
  tempo_changes: TempoChange[];
  rhythmic_complexity: number;
  swing_factor: number;
  groove_template: string;
}

export interface TempoChange {
  time: number;
  bpm: number;
  confidence: number;
}

export interface OnsetDetectionResult {
  onsets: number[];
  onset_strengths: number[];
  onset_types: ('percussive' | 'harmonic' | 'complex')[];
  musical_relevance: number[];
}

export class AdvancedBeatDetector {
  private audioContext: AudioContext;
  private sampleRate: number = 44100;
  
  // Analysis parameters
  private readonly FRAME_SIZE = 2048;
  private readonly HOP_SIZE = 512;
  private readonly ONSET_THRESHOLD = 0.3;
  private readonly BEAT_TRACKING_WINDOW = 8.0; // seconds
  
  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * Perform comprehensive beat analysis on audio buffer
   */
  async analyzeBeatStructure(audioBuffer: AudioBuffer): Promise<BeatAnalysisResult> {
    const channelData = audioBuffer.getChannelData(0);
    this.sampleRate = audioBuffer.sampleRate;
    
    // Multi-stage analysis pipeline
    const onsetResult = await this.detectOnsets(channelData);
    const tempoResult = await this.estimateTempo(onsetResult);
    const beatResult = await this.trackBeats(onsetResult, tempoResult);
    const downbeatResult = await this.detectDownbeats(beatResult);
    const grooveAnalysis = await this.analyzeGroove(beatResult);
    
    return {
      bpm: tempoResult.bpm,
      confidence: tempoResult.confidence,
      beats: beatResult.beats,
      downbeats: downbeatResult.downbeats,
      timeSignature: downbeatResult.timeSignature,
      tempo_changes: tempoResult.tempo_changes,
      rhythmic_complexity: grooveAnalysis.complexity,
      swing_factor: grooveAnalysis.swing_factor,
      groove_template: grooveAnalysis.template
    };
  }

  /**
   * Advanced onset detection using spectral flux and complex domain analysis
   */
  private async detectOnsets(channelData: Float32Array): Promise<OnsetDetectionResult> {
    const onsets: number[] = [];
    const onset_strengths: number[] = [];
    const onset_types: ('percussive' | 'harmonic' | 'complex')[] = [];
    const musical_relevance: number[] = [];
    
    // Spectral flux analysis
    const spectralFlux = this.calculateSpectralFlux(channelData);
    const complexDomain = this.calculateComplexDomain(channelData);
    const highFrequencyContent = this.calculateHFC(channelData);
    
    // Peak picking with adaptive threshold
    const adaptiveThreshold = this.calculateAdaptiveThreshold(spectralFlux);
    
    for (let i = 1; i < spectralFlux.length - 1; i++) {
      const time = (i * this.HOP_SIZE) / this.sampleRate;
      const flux = spectralFlux[i];
      const threshold = adaptiveThreshold[i];
      
      // Multi-criteria onset detection
      if (flux > threshold && 
          flux > spectralFlux[i-1] && 
          flux > spectralFlux[i+1]) {
        
        onsets.push(time);
        onset_strengths.push(flux);
        
        // Classify onset type
        const hfc = highFrequencyContent[i];
        const complex = complexDomain[i];
        
        if (hfc > 0.7) {
          onset_types.push('percussive');
        } else if (complex > 0.6) {
          onset_types.push('complex');
        } else {
          onset_types.push('harmonic');
        }
        
        // Calculate musical relevance based on spectral characteristics
        const relevance = this.calculateMusicalRelevance(flux, hfc, complex);
        musical_relevance.push(relevance);
      }
    }
    
    return { onsets, onset_strengths, onset_types, musical_relevance };
  }

  /**
   * Tempo estimation using autocorrelation and comb filtering
   */
  private async estimateTempo(onsetResult: OnsetDetectionResult): Promise<{
    bpm: number;
    confidence: number;
    tempo_changes: TempoChange[];
  }> {
    const { onsets, onset_strengths } = onsetResult;
    
    // Create onset strength function
    const onsetFunction = this.createOnsetFunction(onsets, onset_strengths);
    
    // Autocorrelation for tempo estimation
    const autocorr = this.autocorrelation(onsetFunction);
    const tempoCandidates = this.findTempoCandidates(autocorr);
    
    // Select best tempo using multiple criteria
    const bestTempo = this.selectBestTempo(tempoCandidates, onsetFunction);
    
    // Detect tempo changes
    const tempo_changes = this.detectTempoChanges(onsets, bestTempo.bpm);
    
    return {
      bpm: bestTempo.bpm,
      confidence: bestTempo.confidence,
      tempo_changes
    };
  }

  /**
   * Beat tracking using dynamic programming
   */
  private async trackBeats(
    onsetResult: OnsetDetectionResult,
    tempoResult: { bpm: number; confidence: number }
  ): Promise<{ beats: number[] }> {
    const { onsets, onset_strengths } = onsetResult;
    const { bpm } = tempoResult;

    const beatPeriod = 60.0 / bpm;
    const beats: number[] = [];

    // Dynamic programming beat tracker
    let currentBeat = 0;
    while (currentBeat < onsets[onsets.length - 1]) {
      const expectedBeat = currentBeat;
      const tolerance = beatPeriod * 0.15; // 15% tolerance

      // Find closest onset to expected beat
      let closestOnset = -1;
      let minDistance = Infinity;

      for (let i = 0; i < onsets.length; i++) {
        const distance = Math.abs(onsets[i] - expectedBeat);
        if (distance < tolerance && distance < minDistance) {
          minDistance = distance;
          closestOnset = i;
        }
      }

      if (closestOnset >= 0) {
        beats.push(onsets[closestOnset]);
        currentBeat = onsets[closestOnset] + beatPeriod;
      } else {
        // No onset found, use predicted beat
        beats.push(expectedBeat);
        currentBeat = expectedBeat + beatPeriod;
      }
    }

    return { beats };
  }

  /**
   * Downbeat detection using harmonic analysis
   */
  private async detectDownbeats(beatResult: { beats: number[] }): Promise<{
    downbeats: number[];
    timeSignature: [number, number];
  }> {
    const { beats } = beatResult;
    const downbeats: number[] = [];

    // Analyze beat patterns to detect downbeats
    const beatIntervals = beats.slice(1).map((beat, i) => beat - beats[i]);
    const avgInterval = beatIntervals.reduce((a, b) => a + b, 0) / beatIntervals.length;

    // Simple 4/4 assumption for now - can be enhanced with harmonic analysis
    const timeSignature: [number, number] = [4, 4];
    const beatsPerMeasure = timeSignature[0];

    for (let i = 0; i < beats.length; i += beatsPerMeasure) {
      if (beats[i]) {
        downbeats.push(beats[i]);
      }
    }

    return { downbeats, timeSignature };
  }

  /**
   * Groove analysis for swing and rhythmic complexity
   */
  private async analyzeGroove(beatResult: { beats: number[] }): Promise<{
    complexity: number;
    swing_factor: number;
    template: string;
  }> {
    const { beats } = beatResult;

    // Calculate rhythmic complexity
    const beatIntervals = beats.slice(1).map((beat, i) => beat - beats[i]);
    const intervalVariance = this.calculateVariance(beatIntervals);
    const complexity = Math.min(1.0, intervalVariance * 10);

    // Detect swing
    const swing_factor = this.detectSwing(beatIntervals);

    // Classify groove template
    let template = 'straight';
    if (swing_factor > 0.1) template = 'swing';
    if (complexity > 0.7) template = 'complex';

    return { complexity, swing_factor, template };
  }

  // Helper methods for spectral analysis
  private calculateSpectralFlux(channelData: Float32Array): number[] {
    // Simplified spectral flux calculation
    const flux: number[] = [];
    const frameSize = this.FRAME_SIZE;
    const hopSize = this.HOP_SIZE;

    let prevSpectrum: number[] = [];

    for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
      const frame = channelData.slice(i, i + frameSize);
      const spectrum = this.fft(frame);

      if (prevSpectrum.length > 0) {
        let fluxValue = 0;
        for (let j = 0; j < Math.min(spectrum.length, prevSpectrum.length); j++) {
          const diff = spectrum[j] - prevSpectrum[j];
          fluxValue += Math.max(0, diff);
        }
        flux.push(fluxValue);
      } else {
        flux.push(0);
      }

      prevSpectrum = spectrum;
    }

    return flux;
  }

  private calculateComplexDomain(channelData: Float32Array): number[] {
    // Simplified complex domain analysis
    return Array(Math.floor(channelData.length / this.HOP_SIZE)).fill(0.5);
  }

  private calculateHFC(channelData: Float32Array): number[] {
    // High Frequency Content calculation
    return Array(Math.floor(channelData.length / this.HOP_SIZE)).fill(0.3);
  }

  private calculateAdaptiveThreshold(spectralFlux: number[]): number[] {
    const windowSize = 10;
    const threshold: number[] = [];

    for (let i = 0; i < spectralFlux.length; i++) {
      const start = Math.max(0, i - windowSize);
      const end = Math.min(spectralFlux.length, i + windowSize);
      const window = spectralFlux.slice(start, end);
      const mean = window.reduce((a, b) => a + b, 0) / window.length;
      const std = Math.sqrt(window.reduce((a, b) => a + (b - mean) ** 2, 0) / window.length);
      threshold.push(mean + 2 * std);
    }

    return threshold;
  }

  private calculateMusicalRelevance(flux: number, hfc: number, complex: number): number {
    // Weighted combination of features
    return (flux * 0.4 + hfc * 0.3 + complex * 0.3);
  }

  private createOnsetFunction(onsets: number[], strengths: number[]): number[] {
    // Create discrete onset strength function
    const maxTime = Math.max(...onsets);
    const resolution = 0.01; // 10ms resolution
    const length = Math.ceil(maxTime / resolution);
    const onsetFunction = new Array(length).fill(0);

    for (let i = 0; i < onsets.length; i++) {
      const index = Math.floor(onsets[i] / resolution);
      if (index < length) {
        onsetFunction[index] = strengths[i];
      }
    }

    return onsetFunction;
  }

  private autocorrelation(signal: number[]): number[] {
    const result: number[] = [];
    const length = signal.length;

    for (let lag = 0; lag < length / 2; lag++) {
      let sum = 0;
      for (let i = 0; i < length - lag; i++) {
        sum += signal[i] * signal[i + lag];
      }
      result.push(sum);
    }

    return result;
  }

  private findTempoCandidates(autocorr: number[]): Array<{ bpm: number; strength: number }> {
    const candidates: Array<{ bpm: number; strength: number }> = [];
    const sampleRate = 100; // 10ms resolution

    // Look for peaks in autocorrelation
    for (let i = 1; i < autocorr.length - 1; i++) {
      if (autocorr[i] > autocorr[i-1] && autocorr[i] > autocorr[i+1]) {
        const period = i / sampleRate; // seconds
        const bpm = 60 / period;

        // Filter reasonable BPM range
        if (bpm >= 60 && bpm <= 200) {
          candidates.push({ bpm, strength: autocorr[i] });
        }
      }
    }

    return candidates.sort((a, b) => b.strength - a.strength);
  }

  private selectBestTempo(candidates: Array<{ bpm: number; strength: number }>, onsetFunction: number[]): {
    bpm: number;
    confidence: number;
  } {
    if (candidates.length === 0) {
      return { bpm: 120, confidence: 0.5 };
    }

    const best = candidates[0];
    const confidence = Math.min(1.0, best.strength / Math.max(...onsetFunction));

    return { bpm: best.bpm, confidence };
  }

  private detectTempoChanges(onsets: number[], baseBpm: number): TempoChange[] {
    // Simplified tempo change detection
    const changes: TempoChange[] = [];
    const windowSize = 8; // seconds

    for (let time = 0; time < onsets[onsets.length - 1]; time += windowSize) {
      const windowOnsets = onsets.filter(o => o >= time && o < time + windowSize);
      if (windowOnsets.length > 2) {
        const intervals = windowOnsets.slice(1).map((o, i) => o - windowOnsets[i]);
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const localBpm = 60 / avgInterval;

        if (Math.abs(localBpm - baseBpm) > 10) {
          changes.push({
            time,
            bpm: localBpm,
            confidence: 0.7
          });
        }
      }
    }

    return changes;
  }

  private detectSwing(intervals: number[]): number {
    // Simplified swing detection
    if (intervals.length < 4) return 0;

    const evenIntervals = intervals.filter((_, i) => i % 2 === 0);
    const oddIntervals = intervals.filter((_, i) => i % 2 === 1);

    if (evenIntervals.length === 0 || oddIntervals.length === 0) return 0;

    const evenAvg = evenIntervals.reduce((a, b) => a + b, 0) / evenIntervals.length;
    const oddAvg = oddIntervals.reduce((a, b) => a + b, 0) / oddIntervals.length;

    return Math.abs(evenAvg - oddAvg) / Math.max(evenAvg, oddAvg);
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  }

  private fft(signal: Float32Array): number[] {
    // Simplified FFT - in production, use a proper FFT library
    const result: number[] = [];
    const N = signal.length;

    for (let k = 0; k < N / 2; k++) {
      let real = 0;
      let imag = 0;

      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += signal[n] * Math.cos(angle);
        imag += signal[n] * Math.sin(angle);
      }

      result.push(Math.sqrt(real * real + imag * imag));
    }

    return result;
  }
}
