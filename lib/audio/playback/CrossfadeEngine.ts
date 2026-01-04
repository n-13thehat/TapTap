/**
 * Advanced Crossfade and Gapless Playback Engine
 * Handles seamless transitions between tracks with professional crossfading
 */

export interface CrossfadeSettings {
  enabled: boolean;
  duration: number; // in seconds
  curve: 'linear' | 'exponential' | 'logarithmic' | 'sine' | 'cosine';
  preGain: number; // gain adjustment before crossfade
  postGain: number; // gain adjustment after crossfade
  eqMatching: boolean; // match EQ between tracks
  tempoSync: boolean; // sync tempo for seamless mixing
}

export interface GaplessSettings {
  enabled: boolean;
  preloadTime: number; // seconds before track end to start preloading
  analysisDepth: number; // how deep to analyze for gapless points
  fadeInDuration: number; // fade in duration for gapless tracks
  fadeOutDuration: number; // fade out duration for gapless tracks
  silenceThreshold: number; // threshold for detecting silence
}

export interface TrackAnalysis {
  hasIntro: boolean;
  hasOutro: boolean;
  introEnd: number; // time when intro ends
  outroStart: number; // time when outro starts
  silenceStart: number; // start of ending silence
  silenceEnd: number; // end of ending silence
  averageRMS: number; // average RMS level
  peakLevel: number; // peak level
  spectralCentroid: number; // average spectral centroid
  tempo: number; // detected tempo
  key: string; // detected key
  energy: number; // energy level (0-1)
}

export interface CrossfadeState {
  isActive: boolean;
  progress: number; // 0-1
  fromTrack: string | null;
  toTrack: string | null;
  startTime: number;
  duration: number;
  curve: CrossfadeSettings['curve'];
}

export class CrossfadeEngine {
  private audioContext: AudioContext;
  private settings: CrossfadeSettings & GaplessSettings;
  
  // Audio nodes
  private masterGain: GainNode;
  private currentGain: GainNode;
  private nextGain: GainNode;
  private currentAnalyser: AnalyserNode;
  private nextAnalyser: AnalyserNode;
  
  // EQ nodes for matching
  private currentEQ: BiquadFilterNode[];
  private nextEQ: BiquadFilterNode[];
  
  // Crossfade state
  private crossfadeState: CrossfadeState;
  private crossfadeTimer: number | null = null;
  
  // Track analysis cache
  private analysisCache = new Map<string, TrackAnalysis>();
  
  // Event callbacks
  private onCrossfadeStart?: (fromTrack: string, toTrack: string) => void;
  private onCrossfadeProgress?: (progress: number) => void;
  private onCrossfadeComplete?: (toTrack: string) => void;
  
  constructor(audioContext: AudioContext, settings: Partial<CrossfadeSettings & GaplessSettings> = {}) {
    this.audioContext = audioContext;
    this.settings = {
      // Crossfade defaults
      enabled: true,
      duration: 3,
      curve: 'sine',
      preGain: 1,
      postGain: 1,
      eqMatching: false,
      tempoSync: false,
      
      // Gapless defaults
      preloadTime: 5,
      analysisDepth: 10,
      fadeInDuration: 0.1,
      fadeOutDuration: 0.1,
      silenceThreshold: -60,
      
      ...settings
    };
    
    this.crossfadeState = {
      isActive: false,
      progress: 0,
      fromTrack: null,
      toTrack: null,
      startTime: 0,
      duration: 0,
      curve: 'sine'
    };
    
    this.initializeAudioGraph();
  }

  private initializeAudioGraph() {
    // Create master gain
    this.masterGain = this.audioContext.createGain();
    
    // Create gain nodes for current and next tracks
    this.currentGain = this.audioContext.createGain();
    this.nextGain = this.audioContext.createGain();
    
    // Create analysers for monitoring
    this.currentAnalyser = this.audioContext.createAnalyser();
    this.nextAnalyser = this.audioContext.createAnalyser();
    
    this.currentAnalyser.fftSize = 2048;
    this.nextAnalyser.fftSize = 2048;
    
    // Create EQ chains (3-band EQ for matching)
    this.currentEQ = this.createEQChain();
    this.nextEQ = this.createEQChain();
    
    // Connect audio graph
    this.connectAudioGraph();
  }

  private createEQChain(): BiquadFilterNode[] {
    const lowShelf = this.audioContext.createBiquadFilter();
    const midPeaking = this.audioContext.createBiquadFilter();
    const highShelf = this.audioContext.createBiquadFilter();
    
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 320;
    lowShelf.gain.value = 0;
    
    midPeaking.type = 'peaking';
    midPeaking.frequency.value = 1000;
    midPeaking.Q.value = 0.7;
    midPeaking.gain.value = 0;
    
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 3200;
    highShelf.gain.value = 0;
    
    // Connect EQ chain
    lowShelf.connect(midPeaking);
    midPeaking.connect(highShelf);
    
    return [lowShelf, midPeaking, highShelf];
  }

  private connectAudioGraph() {
    // Connect current track: source -> EQ -> gain -> analyser -> master
    this.currentEQ[2].connect(this.currentGain);
    this.currentGain.connect(this.currentAnalyser);
    this.currentAnalyser.connect(this.masterGain);
    
    // Connect next track: source -> EQ -> gain -> analyser -> master
    this.nextEQ[2].connect(this.nextGain);
    this.nextGain.connect(this.nextAnalyser);
    this.nextAnalyser.connect(this.masterGain);
    
    // Initially mute next track
    this.nextGain.gain.value = 0;
  }

  public connectCurrentTrack(source: AudioNode): AudioNode {
    source.connect(this.currentEQ[0]);
    return this.masterGain;
  }

  public connectNextTrack(source: AudioNode): AudioNode {
    source.connect(this.nextEQ[0]);
    return this.masterGain;
  }

  public async analyzeTrack(audioBuffer: AudioBuffer, trackId: string): Promise<TrackAnalysis> {
    // Check cache first
    if (this.analysisCache.has(trackId)) {
      return this.analysisCache.get(trackId)!;
    }

    const analysis = await this.performTrackAnalysis(audioBuffer);
    this.analysisCache.set(trackId, analysis);
    return analysis;
  }

  private async performTrackAnalysis(audioBuffer: AudioBuffer): Promise<TrackAnalysis> {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;
    
    // Analyze intro/outro sections
    const introAnalysis = this.analyzeIntroOutro(channelData, sampleRate, 'intro');
    const outroAnalysis = this.analyzeIntroOutro(channelData, sampleRate, 'outro');
    
    // Detect silence at the end
    const silenceAnalysis = this.detectEndingSilence(channelData, sampleRate);
    
    // Calculate RMS and peak levels
    const { averageRMS, peakLevel } = this.calculateLevels(channelData);
    
    // Analyze spectral characteristics
    const spectralCentroid = this.calculateSpectralCentroid(channelData, sampleRate);
    
    // Detect tempo (simplified)
    const tempo = this.detectTempo(channelData, sampleRate);
    
    // Detect key (simplified)
    const key = this.detectKey(channelData, sampleRate);
    
    // Calculate energy
    const energy = this.calculateEnergy(channelData);

    return {
      hasIntro: introAnalysis.hasIntro,
      hasOutro: outroAnalysis.hasOutro,
      introEnd: introAnalysis.end,
      outroStart: outroAnalysis.start,
      silenceStart: silenceAnalysis.start,
      silenceEnd: silenceAnalysis.end,
      averageRMS,
      peakLevel,
      spectralCentroid,
      tempo,
      key,
      energy
    };
  }

  private analyzeIntroOutro(channelData: Float32Array, sampleRate: number, type: 'intro' | 'outro') {
    const windowSize = Math.floor(sampleRate * 0.1); // 100ms windows
    const analysisLength = Math.floor(sampleRate * this.settings.analysisDepth);
    
    let startIndex, endIndex;
    if (type === 'intro') {
      startIndex = 0;
      endIndex = Math.min(analysisLength, channelData.length);
    } else {
      startIndex = Math.max(0, channelData.length - analysisLength);
      endIndex = channelData.length;
    }
    
    const windows = [];
    for (let i = startIndex; i < endIndex - windowSize; i += windowSize) {
      const window = channelData.slice(i, i + windowSize);
      const rms = this.calculateRMS(window);
      const spectralFlux = this.calculateSpectralFlux(window);
      
      windows.push({
        time: i / sampleRate,
        rms,
        spectralFlux,
        hasContent: rms > Math.pow(10, this.settings.silenceThreshold / 20)
      });
    }
    
    // Detect intro/outro boundaries
    let hasSection = false;
    let sectionEnd = 0;
    let sectionStart = 0;
    
    if (type === 'intro') {
      // Find where intro ends (stable content begins)
      for (let i = 1; i < windows.length; i++) {
        if (windows[i].hasContent && windows[i].rms > windows[0].rms * 1.5) {
          hasSection = true;
          sectionEnd = windows[i].time;
          break;
        }
      }
    } else {
      // Find where outro starts (content begins to fade)
      const avgRMS = windows.reduce((sum, w) => sum + w.rms, 0) / windows.length;
      for (let i = 0; i < windows.length - 1; i++) {
        if (windows[i].rms > avgRMS * 0.8 && windows[i + 1].rms < avgRMS * 0.5) {
          hasSection = true;
          sectionStart = windows[i].time;
          break;
        }
      }
    }
    
    return {
      hasIntro: type === 'intro' ? hasSection : false,
      hasOutro: type === 'outro' ? hasSection : false,
      start: sectionStart,
      end: sectionEnd
    };
  }

  private detectEndingSilence(channelData: Float32Array, sampleRate: number) {
    const windowSize = Math.floor(sampleRate * 0.01); // 10ms windows
    const silenceThreshold = Math.pow(10, this.settings.silenceThreshold / 20);
    
    let silenceStart = channelData.length / sampleRate;
    let silenceEnd = channelData.length / sampleRate;
    
    // Scan backwards from the end
    for (let i = channelData.length - windowSize; i >= 0; i -= windowSize) {
      const window = channelData.slice(i, i + windowSize);
      const rms = this.calculateRMS(window);
      
      if (rms > silenceThreshold) {
        silenceStart = (i + windowSize) / sampleRate;
        break;
      }
    }
    
    return { start: silenceStart, end: silenceEnd };
  }

  private calculateLevels(channelData: Float32Array) {
    let sumSquares = 0;
    let peak = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      const sample = Math.abs(channelData[i]);
      sumSquares += sample * sample;
      peak = Math.max(peak, sample);
    }
    
    const averageRMS = Math.sqrt(sumSquares / channelData.length);
    
    return { averageRMS, peakLevel: peak };
  }

  private calculateRMS(samples: Float32Array): number {
    let sumSquares = 0;
    for (let i = 0; i < samples.length; i++) {
      sumSquares += samples[i] * samples[i];
    }
    return Math.sqrt(sumSquares / samples.length);
  }

  private calculateSpectralFlux(samples: Float32Array): number {
    // Simplified spectral flux calculation
    const fft = this.computeFFT(samples);
    let flux = 0;
    
    for (let i = 1; i < fft.length / 2; i++) {
      const magnitude = Math.sqrt(fft[i].real * fft[i].real + fft[i].imag * fft[i].imag);
      flux += magnitude;
    }
    
    return flux / (fft.length / 2);
  }

  private calculateSpectralCentroid(channelData: Float32Array, sampleRate: number): number {
    const fftSize = 2048;
    const fft = this.computeFFT(channelData.slice(0, fftSize));
    
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < fft.length / 2; i++) {
      const frequency = (i * sampleRate) / fftSize;
      const magnitude = Math.sqrt(fft[i].real * fft[i].real + fft[i].imag * fft[i].imag);
      
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  private detectTempo(channelData: Float32Array, sampleRate: number): number {
    // Simplified tempo detection using autocorrelation
    const windowSize = Math.floor(sampleRate * 4); // 4 second window
    const window = channelData.slice(0, Math.min(windowSize, channelData.length));
    
    // Apply onset detection
    const onsets = this.detectOnsets(window, sampleRate);
    
    // Calculate intervals between onsets
    const intervals = [];
    for (let i = 1; i < onsets.length; i++) {
      intervals.push(onsets[i] - onsets[i - 1]);
    }
    
    if (intervals.length === 0) return 120; // Default tempo
    
    // Find most common interval (simplified)
    intervals.sort((a, b) => a - b);
    const medianInterval = intervals[Math.floor(intervals.length / 2)];
    
    // Convert to BPM
    const bpm = 60 / medianInterval;
    
    // Clamp to reasonable range
    return Math.max(60, Math.min(200, bpm));
  }

  private detectOnsets(channelData: Float32Array, sampleRate: number): number[] {
    const hopSize = Math.floor(sampleRate * 0.01); // 10ms hop
    const onsets = [];
    
    let previousFlux = 0;
    
    for (let i = 0; i < channelData.length - hopSize; i += hopSize) {
      const window = channelData.slice(i, i + hopSize);
      const flux = this.calculateSpectralFlux(window);
      
      // Simple onset detection: look for increases in spectral flux
      if (flux > previousFlux * 1.5 && flux > 0.01) {
        onsets.push(i / sampleRate);
      }
      
      previousFlux = flux;
    }
    
    return onsets;
  }

  private detectKey(channelData: Float32Array, sampleRate: number): string {
    // Simplified key detection using chroma features
    const fftSize = 2048;
    const fft = this.computeFFT(channelData.slice(0, fftSize));
    
    const chroma = new Array(12).fill(0);
    
    for (let i = 1; i < fft.length / 2; i++) {
      const frequency = (i * sampleRate) / fftSize;
      const magnitude = Math.sqrt(fft[i].real * fft[i].real + fft[i].imag * fft[i].imag);
      
      if (frequency > 80 && frequency < 2000) {
        const pitchClass = this.frequencyToPitchClass(frequency);
        chroma[pitchClass] += magnitude;
      }
    }
    
    // Find dominant pitch class
    const maxIndex = chroma.indexOf(Math.max(...chroma));
    const keyNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    return keyNames[maxIndex] + ' major'; // Simplified - always assume major
  }

  private frequencyToPitchClass(frequency: number): number {
    const A4 = 440;
    const semitones = 12 * Math.log2(frequency / A4);
    return ((Math.round(semitones) % 12) + 12) % 12;
  }

  private calculateEnergy(channelData: Float32Array): number {
    let energy = 0;
    for (let i = 0; i < channelData.length; i++) {
      energy += channelData[i] * channelData[i];
    }
    return Math.sqrt(energy / channelData.length);
  }

  private computeFFT(samples: Float32Array): { real: number; imag: number }[] {
    // Simplified FFT implementation
    const N = samples.length;
    const result = new Array(N);
    
    for (let k = 0; k < N; k++) {
      let real = 0;
      let imag = 0;
      
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += samples[n] * Math.cos(angle);
        imag += samples[n] * Math.sin(angle);
      }
      
      result[k] = { real, imag };
    }
    
    return result;
  }

  public async startCrossfade(
    fromTrackId: string, 
    toTrackId: string, 
    fromAnalysis?: TrackAnalysis, 
    toAnalysis?: TrackAnalysis
  ): Promise<void> {
    if (!this.settings.enabled) {
      // Instant switch
      this.currentGain.gain.value = 0;
      this.nextGain.gain.value = 1;
      return;
    }

    // Calculate optimal crossfade duration and timing
    let duration = this.settings.duration;
    let curve = this.settings.curve;
    
    if (fromAnalysis && toAnalysis) {
      // Adjust crossfade based on track analysis
      if (this.settings.tempoSync && Math.abs(fromAnalysis.tempo - toAnalysis.tempo) < 10) {
        // Sync to beat if tempos are close
        const beatDuration = 60 / fromAnalysis.tempo;
        duration = Math.round(duration / beatDuration) * beatDuration;
      }
      
      // Adjust curve based on energy levels
      if (fromAnalysis.energy > 0.8 && toAnalysis.energy > 0.8) {
        curve = 'linear'; // Fast crossfade for high energy tracks
      } else if (fromAnalysis.energy < 0.3 || toAnalysis.energy < 0.3) {
        curve = 'sine'; // Smooth crossfade for low energy tracks
      }
      
      // Apply EQ matching if enabled
      if (this.settings.eqMatching) {
        this.applyEQMatching(fromAnalysis, toAnalysis);
      }
    }

    // Set up crossfade state
    this.crossfadeState = {
      isActive: true,
      progress: 0,
      fromTrack: fromTrackId,
      toTrack: toTrackId,
      startTime: this.audioContext.currentTime,
      duration,
      curve
    };

    // Emit start event
    if (this.onCrossfadeStart) {
      this.onCrossfadeStart(fromTrackId, toTrackId);
    }

    // Start crossfade animation
    this.animateCrossfade();
  }

  private applyEQMatching(fromAnalysis: TrackAnalysis, toAnalysis: TrackAnalysis) {
    // Simple EQ matching based on spectral centroid
    const centroidDiff = toAnalysis.spectralCentroid - fromAnalysis.spectralCentroid;
    
    // Adjust high shelf to match brightness
    const highGain = Math.max(-6, Math.min(6, centroidDiff / 1000));
    this.nextEQ[2].gain.value = highGain;
    
    // Adjust levels to match RMS
    const levelDiff = toAnalysis.averageRMS / fromAnalysis.averageRMS;
    const gainAdjust = Math.max(0.5, Math.min(2, levelDiff));
    this.nextGain.gain.value *= gainAdjust;
  }

  private animateCrossfade() {
    if (!this.crossfadeState.isActive) return;

    const elapsed = this.audioContext.currentTime - this.crossfadeState.startTime;
    const progress = Math.min(1, elapsed / this.crossfadeState.duration);
    
    this.crossfadeState.progress = progress;

    // Calculate gain values based on curve
    const { fromGain, toGain } = this.calculateCrossfadeGains(progress, this.crossfadeState.curve);
    
    // Apply gains
    this.currentGain.gain.value = fromGain * this.settings.preGain;
    this.nextGain.gain.value = toGain * this.settings.postGain;

    // Emit progress event
    if (this.onCrossfadeProgress) {
      this.onCrossfadeProgress(progress);
    }

    if (progress >= 1) {
      // Crossfade complete
      this.crossfadeState.isActive = false;
      
      // Swap tracks
      this.swapTracks();
      
      // Emit complete event
      if (this.onCrossfadeComplete && this.crossfadeState.toTrack) {
        this.onCrossfadeComplete(this.crossfadeState.toTrack);
      }
    } else {
      // Continue animation
      this.crossfadeTimer = requestAnimationFrame(() => this.animateCrossfade());
    }
  }

  private calculateCrossfadeGains(progress: number, curve: CrossfadeSettings['curve']): { fromGain: number; toGain: number } {
    let fromGain: number;
    let toGain: number;

    switch (curve) {
      case 'linear':
        fromGain = 1 - progress;
        toGain = progress;
        break;
        
      case 'exponential':
        fromGain = Math.pow(1 - progress, 2);
        toGain = Math.pow(progress, 2);
        break;
        
      case 'logarithmic':
        fromGain = Math.log(1 + (1 - progress) * (Math.E - 1)) / Math.log(Math.E);
        toGain = Math.log(1 + progress * (Math.E - 1)) / Math.log(Math.E);
        break;
        
      case 'sine':
        fromGain = Math.cos(progress * Math.PI / 2);
        toGain = Math.sin(progress * Math.PI / 2);
        break;
        
      case 'cosine':
        fromGain = (Math.cos(progress * Math.PI) + 1) / 2;
        toGain = (1 - Math.cos(progress * Math.PI)) / 2;
        break;
        
      default:
        fromGain = 1 - progress;
        toGain = progress;
    }

    return { fromGain, toGain };
  }

  private swapTracks() {
    // Swap gain nodes
    [this.currentGain, this.nextGain] = [this.nextGain, this.currentGain];
    [this.currentAnalyser, this.nextAnalyser] = [this.nextAnalyser, this.currentAnalyser];
    [this.currentEQ, this.nextEQ] = [this.nextEQ, this.currentEQ];
    
    // Reset next track gain
    this.nextGain.gain.value = 0;
    
    // Reset EQ
    this.nextEQ.forEach(filter => {
      filter.gain.value = 0;
    });
  }

  public stopCrossfade() {
    if (this.crossfadeTimer) {
      cancelAnimationFrame(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }
    
    this.crossfadeState.isActive = false;
  }

  public updateSettings(newSettings: Partial<CrossfadeSettings & GaplessSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  public getSettings(): CrossfadeSettings & GaplessSettings {
    return { ...this.settings };
  }

  public getCrossfadeState(): CrossfadeState {
    return { ...this.crossfadeState };
  }

  public setEventCallbacks(callbacks: {
    onCrossfadeStart?: (fromTrack: string, toTrack: string) => void;
    onCrossfadeProgress?: (progress: number) => void;
    onCrossfadeComplete?: (toTrack: string) => void;
  }) {
    this.onCrossfadeStart = callbacks.onCrossfadeStart;
    this.onCrossfadeProgress = callbacks.onCrossfadeProgress;
    this.onCrossfadeComplete = callbacks.onCrossfadeComplete;
  }

  public getAnalyserNodes(): { current: AnalyserNode; next: AnalyserNode } {
    return {
      current: this.currentAnalyser,
      next: this.nextAnalyser
    };
  }

  public getMasterGain(): GainNode {
    return this.masterGain;
  }

  public clearAnalysisCache() {
    this.analysisCache.clear();
  }

  public destroy() {
    this.stopCrossfade();
    this.clearAnalysisCache();
    
    // Disconnect all nodes
    this.masterGain.disconnect();
    this.currentGain.disconnect();
    this.nextGain.disconnect();
    this.currentAnalyser.disconnect();
    this.nextAnalyser.disconnect();
    
    this.currentEQ.forEach(filter => filter.disconnect());
    this.nextEQ.forEach(filter => filter.disconnect());
  }
}
