/**
 * Advanced Audio Effects Processor
 * Professional-grade audio effects with real-time processing
 */

export interface EffectParameter {
  id: string;
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  curve?: 'linear' | 'logarithmic' | 'exponential';
}

export interface EffectPreset {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, number>;
  tags: string[];
}

export interface AudioEffect {
  id: string;
  name: string;
  type: string;
  category: 'dynamics' | 'eq' | 'spatial' | 'modulation' | 'distortion' | 'filter' | 'utility';
  enabled: boolean;
  bypassed: boolean;
  parameters: EffectParameter[];
  presets: EffectPreset[];
  wetDryMix: number;
  inputGain: number;
  outputGain: number;
  cpuUsage: number;
  latency: number;
}

export class AdvancedAudioEffects {
  private audioContext: AudioContext;
  private effects: Map<string, AudioEffect> = new Map();
  private effectNodes: Map<string, AudioNode[]> = new Map();
  private inputNode: GainNode;
  private outputNode: GainNode;
  private analyserNode: AnalyserNode;
  
  // Effect chain
  private effectChain: string[] = [];
  private isProcessing = false;
  
  // Performance monitoring
  private cpuUsageHistory: number[] = [];
  private latencyHistory: number[] = [];
  
  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    
    // Create input/output nodes
    this.inputNode = audioContext.createGain();
    this.outputNode = audioContext.createGain();
    this.analyserNode = audioContext.createAnalyser();
    
    // Configure analyser
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.8;
    
    // Connect analyser to output for monitoring
    this.outputNode.connect(this.analyserNode);
    
    // Initialize built-in effects
    this.initializeBuiltInEffects();
  }

  private initializeBuiltInEffects() {
    // Parametric EQ
    this.registerEffect({
      id: 'parametric-eq',
      name: 'Parametric EQ',
      type: 'equalizer',
      category: 'eq',
      enabled: false,
      bypassed: false,
      parameters: [
        { id: 'lowGain', name: 'Low Gain', value: 0, min: -20, max: 20, step: 0.1, unit: 'dB' },
        { id: 'lowFreq', name: 'Low Freq', value: 100, min: 20, max: 500, step: 1, unit: 'Hz', curve: 'logarithmic' },
        { id: 'lowQ', name: 'Low Q', value: 0.7, min: 0.1, max: 10, step: 0.1, unit: '' },
        { id: 'midGain', name: 'Mid Gain', value: 0, min: -20, max: 20, step: 0.1, unit: 'dB' },
        { id: 'midFreq', name: 'Mid Freq', value: 1000, min: 200, max: 5000, step: 1, unit: 'Hz', curve: 'logarithmic' },
        { id: 'midQ', name: 'Mid Q', value: 0.7, min: 0.1, max: 10, step: 0.1, unit: '' },
        { id: 'highGain', name: 'High Gain', value: 0, min: -20, max: 20, step: 0.1, unit: 'dB' },
        { id: 'highFreq', name: 'High Freq', value: 8000, min: 2000, max: 20000, step: 1, unit: 'Hz', curve: 'logarithmic' },
        { id: 'highQ', name: 'High Q', value: 0.7, min: 0.1, max: 10, step: 0.1, unit: '' }
      ],
      presets: [
        { id: 'flat', name: 'Flat', description: 'No EQ applied', parameters: { lowGain: 0, midGain: 0, highGain: 0 }, tags: ['neutral'] },
        { id: 'vocal-enhance', name: 'Vocal Enhance', description: 'Enhance vocal clarity', parameters: { lowGain: -2, midGain: 3, highGain: 2, midFreq: 2000 }, tags: ['vocal', 'clarity'] },
        { id: 'bass-boost', name: 'Bass Boost', description: 'Enhanced low frequencies', parameters: { lowGain: 6, midGain: 0, highGain: 0, lowFreq: 80 }, tags: ['bass', 'low-end'] },
        { id: 'presence', name: 'Presence', description: 'Enhanced presence and clarity', parameters: { lowGain: 0, midGain: 2, highGain: 4, midFreq: 3000, highFreq: 10000 }, tags: ['presence', 'clarity'] }
      ],
      wetDryMix: 1.0,
      inputGain: 1.0,
      outputGain: 1.0,
      cpuUsage: 0,
      latency: 0
    });

    // Compressor
    this.registerEffect({
      id: 'compressor',
      name: 'Compressor',
      type: 'compressor',
      category: 'dynamics',
      enabled: false,
      bypassed: false,
      parameters: [
        { id: 'threshold', name: 'Threshold', value: -12, min: -60, max: 0, step: 0.1, unit: 'dB' },
        { id: 'ratio', name: 'Ratio', value: 4, min: 1, max: 20, step: 0.1, unit: ':1' },
        { id: 'attack', name: 'Attack', value: 10, min: 0, max: 100, step: 0.1, unit: 'ms', curve: 'logarithmic' },
        { id: 'release', name: 'Release', value: 100, min: 10, max: 1000, step: 1, unit: 'ms', curve: 'logarithmic' },
        { id: 'knee', name: 'Knee', value: 2, min: 0, max: 10, step: 0.1, unit: 'dB' },
        { id: 'makeupGain', name: 'Makeup Gain', value: 0, min: 0, max: 20, step: 0.1, unit: 'dB' }
      ],
      presets: [
        { id: 'gentle', name: 'Gentle', description: 'Subtle compression', parameters: { threshold: -18, ratio: 2, attack: 20, release: 200 }, tags: ['gentle', 'subtle'] },
        { id: 'vocal', name: 'Vocal', description: 'Vocal compression', parameters: { threshold: -15, ratio: 3, attack: 5, release: 50, makeupGain: 3 }, tags: ['vocal'] },
        { id: 'punchy', name: 'Punchy', description: 'Punchy compression', parameters: { threshold: -10, ratio: 6, attack: 1, release: 30, makeupGain: 4 }, tags: ['punchy', 'aggressive'] },
        { id: 'limiter', name: 'Limiter', description: 'Hard limiting', parameters: { threshold: -3, ratio: 20, attack: 0.1, release: 10, knee: 0 }, tags: ['limiter', 'protection'] }
      ],
      wetDryMix: 1.0,
      inputGain: 1.0,
      outputGain: 1.0,
      cpuUsage: 0,
      latency: 0
    });

    // Reverb
    this.registerEffect({
      id: 'reverb',
      name: 'Algorithmic Reverb',
      type: 'reverb',
      category: 'spatial',
      enabled: false,
      bypassed: false,
      parameters: [
        { id: 'roomSize', name: 'Room Size', value: 0.5, min: 0, max: 1, step: 0.01, unit: '' },
        { id: 'damping', name: 'Damping', value: 0.5, min: 0, max: 1, step: 0.01, unit: '' },
        { id: 'wetLevel', name: 'Wet Level', value: 0.3, min: 0, max: 1, step: 0.01, unit: '' },
        { id: 'dryLevel', name: 'Dry Level', value: 0.8, min: 0, max: 1, step: 0.01, unit: '' },
        { id: 'predelay', name: 'Pre-delay', value: 20, min: 0, max: 100, step: 1, unit: 'ms' },
        { id: 'width', name: 'Stereo Width', value: 1, min: 0, max: 2, step: 0.01, unit: '' }
      ],
      presets: [
        { id: 'room', name: 'Room', description: 'Small room reverb', parameters: { roomSize: 0.3, damping: 0.6, wetLevel: 0.2, predelay: 10 }, tags: ['room', 'small'] },
        { id: 'hall', name: 'Hall', description: 'Concert hall reverb', parameters: { roomSize: 0.8, damping: 0.3, wetLevel: 0.4, predelay: 30 }, tags: ['hall', 'large'] },
        { id: 'plate', name: 'Plate', description: 'Plate reverb simulation', parameters: { roomSize: 0.6, damping: 0.8, wetLevel: 0.3, predelay: 5 }, tags: ['plate', 'vintage'] },
        { id: 'ambient', name: 'Ambient', description: 'Ambient space', parameters: { roomSize: 0.9, damping: 0.2, wetLevel: 0.5, predelay: 50, width: 1.5 }, tags: ['ambient', 'spacious'] }
      ],
      wetDryMix: 1.0,
      inputGain: 1.0,
      outputGain: 1.0,
      cpuUsage: 0,
      latency: 0
    });

    // Delay
    this.registerEffect({
      id: 'delay',
      name: 'Stereo Delay',
      type: 'delay',
      category: 'modulation',
      enabled: false,
      bypassed: false,
      parameters: [
        { id: 'delayTime', name: 'Delay Time', value: 250, min: 1, max: 2000, step: 1, unit: 'ms', curve: 'logarithmic' },
        { id: 'feedback', name: 'Feedback', value: 0.3, min: 0, max: 0.95, step: 0.01, unit: '' },
        { id: 'wetLevel', name: 'Wet Level', value: 0.25, min: 0, max: 1, step: 0.01, unit: '' },
        { id: 'dryLevel', name: 'Dry Level', value: 0.8, min: 0, max: 1, step: 0.01, unit: '' },
        { id: 'highCut', name: 'High Cut', value: 8000, min: 1000, max: 20000, step: 100, unit: 'Hz', curve: 'logarithmic' },
        { id: 'lowCut', name: 'Low Cut', value: 100, min: 20, max: 1000, step: 10, unit: 'Hz', curve: 'logarithmic' },
        { id: 'stereoSpread', name: 'Stereo Spread', value: 0.5, min: 0, max: 1, step: 0.01, unit: '' }
      ],
      presets: [
        { id: 'eighth', name: 'Eighth Note', description: '1/8 note delay', parameters: { delayTime: 125, feedback: 0.3, wetLevel: 0.2 }, tags: ['rhythmic', 'eighth'] },
        { id: 'quarter', name: 'Quarter Note', description: '1/4 note delay', parameters: { delayTime: 250, feedback: 0.4, wetLevel: 0.25 }, tags: ['rhythmic', 'quarter'] },
        { id: 'slapback', name: 'Slapback', description: 'Short slapback delay', parameters: { delayTime: 80, feedback: 0.1, wetLevel: 0.3 }, tags: ['slapback', 'vintage'] },
        { id: 'ambient', name: 'Ambient', description: 'Long ambient delay', parameters: { delayTime: 500, feedback: 0.6, wetLevel: 0.4, highCut: 4000 }, tags: ['ambient', 'atmospheric'] }
      ],
      wetDryMix: 1.0,
      inputGain: 1.0,
      outputGain: 1.0,
      cpuUsage: 0,
      latency: 0
    });

    // Chorus
    this.registerEffect({
      id: 'chorus',
      name: 'Chorus',
      type: 'chorus',
      category: 'modulation',
      enabled: false,
      bypassed: false,
      parameters: [
        { id: 'rate', name: 'Rate', value: 0.5, min: 0.1, max: 10, step: 0.1, unit: 'Hz' },
        { id: 'depth', name: 'Depth', value: 0.3, min: 0, max: 1, step: 0.01, unit: '' },
        { id: 'delay', name: 'Delay', value: 20, min: 5, max: 50, step: 1, unit: 'ms' },
        { id: 'feedback', name: 'Feedback', value: 0.2, min: 0, max: 0.8, step: 0.01, unit: '' },
        { id: 'wetLevel', name: 'Wet Level', value: 0.5, min: 0, max: 1, step: 0.01, unit: '' },
        { id: 'voices', name: 'Voices', value: 2, min: 1, max: 4, step: 1, unit: '' }
      ],
      presets: [
        { id: 'subtle', name: 'Subtle', description: 'Gentle chorus', parameters: { rate: 0.3, depth: 0.2, wetLevel: 0.3 }, tags: ['subtle', 'gentle'] },
        { id: 'classic', name: 'Classic', description: 'Classic chorus sound', parameters: { rate: 0.5, depth: 0.4, wetLevel: 0.5, voices: 2 }, tags: ['classic', 'vintage'] },
        { id: 'wide', name: 'Wide', description: 'Wide stereo chorus', parameters: { rate: 0.8, depth: 0.6, wetLevel: 0.6, voices: 3 }, tags: ['wide', 'stereo'] },
        { id: 'shimmer', name: 'Shimmer', description: 'Shimmering chorus', parameters: { rate: 1.2, depth: 0.5, wetLevel: 0.7, voices: 4 }, tags: ['shimmer', 'ethereal'] }
      ],
      wetDryMix: 1.0,
      inputGain: 1.0,
      outputGain: 1.0,
      cpuUsage: 0,
      latency: 0
    });

    // Distortion
    this.registerEffect({
      id: 'distortion',
      name: 'Distortion',
      type: 'distortion',
      category: 'distortion',
      enabled: false,
      bypassed: false,
      parameters: [
        { id: 'drive', name: 'Drive', value: 5, min: 0, max: 50, step: 0.1, unit: 'dB' },
        { id: 'tone', name: 'Tone', value: 0.5, min: 0, max: 1, step: 0.01, unit: '' },
        { id: 'level', name: 'Level', value: 0.5, min: 0, max: 1, step: 0.01, unit: '' },
        { id: 'type', name: 'Type', value: 0, min: 0, max: 3, step: 1, unit: '' }, // 0=soft, 1=hard, 2=tube, 3=fuzz
        { id: 'asymmetry', name: 'Asymmetry', value: 0, min: -1, max: 1, step: 0.01, unit: '' },
        { id: 'bias', name: 'Bias', value: 0, min: -0.5, max: 0.5, step: 0.01, unit: '' }
      ],
      presets: [
        { id: 'warm', name: 'Warm', description: 'Warm tube saturation', parameters: { drive: 3, tone: 0.6, level: 0.7, type: 2 }, tags: ['warm', 'tube'] },
        { id: 'crunch', name: 'Crunch', description: 'Crunchy distortion', parameters: { drive: 8, tone: 0.5, level: 0.6, type: 1 }, tags: ['crunch', 'rock'] },
        { id: 'fuzz', name: 'Fuzz', description: 'Vintage fuzz', parameters: { drive: 15, tone: 0.4, level: 0.5, type: 3, asymmetry: 0.3 }, tags: ['fuzz', 'vintage'] },
        { id: 'overdrive', name: 'Overdrive', description: 'Smooth overdrive', parameters: { drive: 6, tone: 0.7, level: 0.8, type: 0 }, tags: ['overdrive', 'smooth'] }
      ],
      wetDryMix: 1.0,
      inputGain: 1.0,
      outputGain: 1.0,
      cpuUsage: 0,
      latency: 0
    });
  }

  public registerEffect(effect: AudioEffect) {
    this.effects.set(effect.id, effect);
  }

  public getEffect(effectId: string): AudioEffect | undefined {
    return this.effects.get(effectId);
  }

  public getAllEffects(): AudioEffect[] {
    return Array.from(this.effects.values());
  }

  public getEffectsByCategory(category: AudioEffect['category']): AudioEffect[] {
    return Array.from(this.effects.values()).filter(effect => effect.category === category);
  }

  public enableEffect(effectId: string): boolean {
    const effect = this.effects.get(effectId);
    if (!effect) return false;

    effect.enabled = true;
    this.rebuildEffectChain();
    return true;
  }

  public disableEffect(effectId: string): boolean {
    const effect = this.effects.get(effectId);
    if (!effect) return false;

    effect.enabled = false;
    this.rebuildEffectChain();
    return true;
  }

  public bypassEffect(effectId: string, bypassed: boolean): boolean {
    const effect = this.effects.get(effectId);
    if (!effect) return false;

    effect.bypassed = bypassed;
    this.updateEffectBypass(effectId, bypassed);
    return true;
  }

  public setEffectParameter(effectId: string, parameterId: string, value: number): boolean {
    const effect = this.effects.get(effectId);
    if (!effect) return false;

    const parameter = effect.parameters.find(p => p.id === parameterId);
    if (!parameter) return false;

    // Clamp value to parameter range
    parameter.value = Math.max(parameter.min, Math.min(parameter.max, value));
    
    // Update the actual audio node parameter
    this.updateEffectParameter(effectId, parameterId, parameter.value);
    
    return true;
  }

  public loadPreset(effectId: string, presetId: string): boolean {
    const effect = this.effects.get(effectId);
    if (!effect) return false;

    const preset = effect.presets.find(p => p.id === presetId);
    if (!preset) return false;

    // Apply all preset parameters
    Object.entries(preset.parameters).forEach(([paramId, value]) => {
      this.setEffectParameter(effectId, paramId, value);
    });

    return true;
  }

  public setEffectChainOrder(effectIds: string[]): boolean {
    // Validate all effect IDs exist
    for (const id of effectIds) {
      if (!this.effects.has(id)) return false;
    }

    this.effectChain = effectIds;
    this.rebuildEffectChain();
    return true;
  }

  public getEffectChain(): string[] {
    return [...this.effectChain];
  }

  private rebuildEffectChain() {
    // Disconnect all existing nodes
    this.disconnectAllEffects();

    // Build new chain
    let currentInput = this.inputNode;
    
    for (const effectId of this.effectChain) {
      const effect = this.effects.get(effectId);
      if (!effect || !effect.enabled) continue;

      const effectNodes = this.createEffectNodes(effect);
      if (effectNodes.length === 0) continue;

      // Connect to chain
      currentInput.connect(effectNodes[0]);
      currentInput = effectNodes[effectNodes.length - 1] as GainNode;
      
      this.effectNodes.set(effectId, effectNodes);
    }

    // Connect final output
    currentInput.connect(this.outputNode);
  }

  private createEffectNodes(effect: AudioEffect): AudioNode[] {
    const nodes: AudioNode[] = [];

    switch (effect.type) {
      case 'equalizer':
        nodes.push(...this.createEqualizerNodes(effect));
        break;
      case 'compressor':
        nodes.push(...this.createCompressorNodes(effect));
        break;
      case 'reverb':
        nodes.push(...this.createReverbNodes(effect));
        break;
      case 'delay':
        nodes.push(...this.createDelayNodes(effect));
        break;
      case 'chorus':
        nodes.push(...this.createChorusNodes(effect));
        break;
      case 'distortion':
        nodes.push(...this.createDistortionNodes(effect));
        break;
      default:
        console.warn(`Unknown effect type: ${effect.type}`);
    }

    return nodes;
  }

  private createEqualizerNodes(effect: AudioEffect): AudioNode[] {
    const lowFilter = this.audioContext.createBiquadFilter();
    const midFilter = this.audioContext.createBiquadFilter();
    const highFilter = this.audioContext.createBiquadFilter();

    lowFilter.type = 'peaking';
    midFilter.type = 'peaking';
    highFilter.type = 'peaking';

    // Set initial parameters
    const lowGain = effect.parameters.find(p => p.id === 'lowGain')?.value || 0;
    const lowFreq = effect.parameters.find(p => p.id === 'lowFreq')?.value || 100;
    const lowQ = effect.parameters.find(p => p.id === 'lowQ')?.value || 0.7;
    
    lowFilter.gain.value = lowGain;
    lowFilter.frequency.value = lowFreq;
    lowFilter.Q.value = lowQ;

    const midGain = effect.parameters.find(p => p.id === 'midGain')?.value || 0;
    const midFreq = effect.parameters.find(p => p.id === 'midFreq')?.value || 1000;
    const midQ = effect.parameters.find(p => p.id === 'midQ')?.value || 0.7;
    
    midFilter.gain.value = midGain;
    midFilter.frequency.value = midFreq;
    midFilter.Q.value = midQ;

    const highGain = effect.parameters.find(p => p.id === 'highGain')?.value || 0;
    const highFreq = effect.parameters.find(p => p.id === 'highFreq')?.value || 8000;
    const highQ = effect.parameters.find(p => p.id === 'highQ')?.value || 0.7;
    
    highFilter.gain.value = highGain;
    highFilter.frequency.value = highFreq;
    highFilter.Q.value = highQ;

    // Connect filters in series
    lowFilter.connect(midFilter);
    midFilter.connect(highFilter);

    return [lowFilter, midFilter, highFilter];
  }

  private createCompressorNodes(effect: AudioEffect): AudioNode[] {
    const compressor = this.audioContext.createDynamicsCompressor();
    const makeupGain = this.audioContext.createGain();

    // Set parameters
    const threshold = effect.parameters.find(p => p.id === 'threshold')?.value || -12;
    const ratio = effect.parameters.find(p => p.id === 'ratio')?.value || 4;
    const attack = effect.parameters.find(p => p.id === 'attack')?.value || 10;
    const release = effect.parameters.find(p => p.id === 'release')?.value || 100;
    const knee = effect.parameters.find(p => p.id === 'knee')?.value || 2;
    const makeup = effect.parameters.find(p => p.id === 'makeupGain')?.value || 0;

    compressor.threshold.value = threshold;
    compressor.ratio.value = ratio;
    compressor.attack.value = attack / 1000; // Convert to seconds
    compressor.release.value = release / 1000; // Convert to seconds
    compressor.knee.value = knee;
    
    makeupGain.gain.value = this.dbToLinear(makeup);

    compressor.connect(makeupGain);

    return [compressor, makeupGain];
  }

  private createReverbNodes(effect: AudioEffect): AudioNode[] {
    // Create convolution reverb with impulse response
    const convolver = this.audioContext.createConvolver();
    const wetGain = this.audioContext.createGain();
    const dryGain = this.audioContext.createGain();
    const output = this.audioContext.createGain();

    // Set wet/dry levels
    const wetLevel = effect.parameters.find(p => p.id === 'wetLevel')?.value || 0.3;
    const dryLevel = effect.parameters.find(p => p.id === 'dryLevel')?.value || 0.8;

    wetGain.gain.value = wetLevel;
    dryGain.gain.value = dryLevel;

    // Generate impulse response
    const roomSize = effect.parameters.find(p => p.id === 'roomSize')?.value || 0.5;
    const damping = effect.parameters.find(p => p.id === 'damping')?.value || 0.5;
    
    convolver.buffer = this.generateImpulseResponse(roomSize, damping);

    // Connect wet path
    convolver.connect(wetGain);
    wetGain.connect(output);

    // Dry path will be connected externally
    dryGain.connect(output);

    return [convolver, wetGain, dryGain, output];
  }

  private createDelayNodes(effect: AudioEffect): AudioNode[] {
    const delay = this.audioContext.createDelay(2); // Max 2 seconds
    const feedback = this.audioContext.createGain();
    const wetGain = this.audioContext.createGain();
    const dryGain = this.audioContext.createGain();
    const highCut = this.audioContext.createBiquadFilter();
    const lowCut = this.audioContext.createBiquadFilter();
    const output = this.audioContext.createGain();

    // Set parameters
    const delayTime = effect.parameters.find(p => p.id === 'delayTime')?.value || 250;
    const feedbackAmount = effect.parameters.find(p => p.id === 'feedback')?.value || 0.3;
    const wetLevel = effect.parameters.find(p => p.id === 'wetLevel')?.value || 0.25;
    const dryLevel = effect.parameters.find(p => p.id === 'dryLevel')?.value || 0.8;
    const highCutFreq = effect.parameters.find(p => p.id === 'highCut')?.value || 8000;
    const lowCutFreq = effect.parameters.find(p => p.id === 'lowCut')?.value || 100;

    delay.delayTime.value = delayTime / 1000; // Convert to seconds
    feedback.gain.value = feedbackAmount;
    wetGain.gain.value = wetLevel;
    dryGain.gain.value = dryLevel;

    // Configure filters
    highCut.type = 'lowpass';
    highCut.frequency.value = highCutFreq;
    lowCut.type = 'highpass';
    lowCut.frequency.value = lowCutFreq;

    // Connect delay feedback loop
    delay.connect(highCut);
    highCut.connect(lowCut);
    lowCut.connect(feedback);
    feedback.connect(delay);

    // Connect wet output
    lowCut.connect(wetGain);
    wetGain.connect(output);

    // Dry path
    dryGain.connect(output);

    return [delay, feedback, wetGain, dryGain, highCut, lowCut, output];
  }

  private createChorusNodes(effect: AudioEffect): AudioNode[] {
    const voices = effect.parameters.find(p => p.id === 'voices')?.value || 2;
    const rate = effect.parameters.find(p => p.id === 'rate')?.value || 0.5;
    const depth = effect.parameters.find(p => p.id === 'depth')?.value || 0.3;
    const delayTime = effect.parameters.find(p => p.id === 'delay')?.value || 20;
    const wetLevel = effect.parameters.find(p => p.id === 'wetLevel')?.value || 0.5;

    const nodes: AudioNode[] = [];
    const wetGain = this.audioContext.createGain();
    const dryGain = this.audioContext.createGain();
    const output = this.audioContext.createGain();

    wetGain.gain.value = wetLevel;
    dryGain.gain.value = 1 - wetLevel;

    // Create multiple voices
    for (let i = 0; i < voices; i++) {
      const delay = this.audioContext.createDelay(0.1);
      const lfo = this.audioContext.createOscillator();
      const lfoGain = this.audioContext.createGain();
      const voiceGain = this.audioContext.createGain();

      // Configure LFO
      lfo.frequency.value = rate * (1 + i * 0.1); // Slightly different rates
      lfo.type = 'sine';
      lfoGain.gain.value = (depth * delayTime / 1000) / 2; // Convert to seconds

      // Configure delay
      delay.delayTime.value = (delayTime / 1000) + (i * 0.005); // Slight offset per voice
      voiceGain.gain.value = 1 / voices; // Equal mix

      // Connect LFO to delay time
      lfo.connect(lfoGain);
      lfoGain.connect(delay.delayTime);
      lfo.start();

      // Connect voice to wet output
      delay.connect(voiceGain);
      voiceGain.connect(wetGain);

      nodes.push(delay, lfo, lfoGain, voiceGain);
    }

    wetGain.connect(output);
    dryGain.connect(output);
    nodes.push(wetGain, dryGain, output);

    return nodes;
  }

  private createDistortionNodes(effect: AudioEffect): AudioNode[] {
    const inputGain = this.audioContext.createGain();
    const waveshaper = this.audioContext.createWaveShaper();
    const toneFilter = this.audioContext.createBiquadFilter();
    const outputGain = this.audioContext.createGain();

    // Set parameters
    const drive = effect.parameters.find(p => p.id === 'drive')?.value || 5;
    const tone = effect.parameters.find(p => p.id === 'tone')?.value || 0.5;
    const level = effect.parameters.find(p => p.id === 'level')?.value || 0.5;
    const type = effect.parameters.find(p => p.id === 'type')?.value || 0;

    inputGain.gain.value = this.dbToLinear(drive);
    outputGain.gain.value = level;

    // Configure tone filter
    toneFilter.type = 'lowpass';
    toneFilter.frequency.value = 1000 + (tone * 9000); // 1kHz to 10kHz

    // Generate distortion curve
    waveshaper.curve = this.generateDistortionCurve(type);
    waveshaper.oversample = '4x';

    // Connect nodes
    inputGain.connect(waveshaper);
    waveshaper.connect(toneFilter);
    toneFilter.connect(outputGain);

    return [inputGain, waveshaper, toneFilter, outputGain];
  }

  private generateImpulseResponse(roomSize: number, damping: number): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const length = Math.floor(sampleRate * (0.1 + roomSize * 2)); // 0.1 to 2.1 seconds
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - damping, i / sampleRate);
        const noise = (Math.random() * 2 - 1) * decay;
        channelData[i] = noise;
      }
    }

    return buffer;
  }

  private generateDistortionCurve(type: number): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      
      switch (Math.floor(type)) {
        case 0: // Soft clipping
          curve[i] = Math.tanh(x * 2);
          break;
        case 1: // Hard clipping
          curve[i] = Math.max(-0.8, Math.min(0.8, x * 5));
          break;
        case 2: // Tube saturation
          curve[i] = x * (1 - Math.abs(x) * 0.5);
          break;
        case 3: // Fuzz
          curve[i] = x > 0 ? 1 : -1;
          break;
        default:
          curve[i] = x;
      }
    }

    return curve;
  }

  private updateEffectParameter(effectId: string, parameterId: string, value: number) {
    const nodes = this.effectNodes.get(effectId);
    if (!nodes) return;

    const effect = this.effects.get(effectId);
    if (!effect) return;

    // Update specific parameters based on effect type
    switch (effect.type) {
      case 'equalizer':
        this.updateEqualizerParameter(nodes, parameterId, value);
        break;
      case 'compressor':
        this.updateCompressorParameter(nodes, parameterId, value);
        break;
      case 'reverb':
        this.updateReverbParameter(nodes, parameterId, value);
        break;
      case 'delay':
        this.updateDelayParameter(nodes, parameterId, value);
        break;
      case 'chorus':
        this.updateChorusParameter(nodes, parameterId, value);
        break;
      case 'distortion':
        this.updateDistortionParameter(nodes, parameterId, value);
        break;
    }
  }

  private updateEqualizerParameter(nodes: AudioNode[], parameterId: string, value: number) {
    const [lowFilter, midFilter, highFilter] = nodes as BiquadFilterNode[];

    switch (parameterId) {
      case 'lowGain':
        lowFilter.gain.value = value;
        break;
      case 'lowFreq':
        lowFilter.frequency.value = value;
        break;
      case 'lowQ':
        lowFilter.Q.value = value;
        break;
      case 'midGain':
        midFilter.gain.value = value;
        break;
      case 'midFreq':
        midFilter.frequency.value = value;
        break;
      case 'midQ':
        midFilter.Q.value = value;
        break;
      case 'highGain':
        highFilter.gain.value = value;
        break;
      case 'highFreq':
        highFilter.frequency.value = value;
        break;
      case 'highQ':
        highFilter.Q.value = value;
        break;
    }
  }

  private updateCompressorParameter(nodes: AudioNode[], parameterId: string, value: number) {
    const [compressor, makeupGain] = nodes as [DynamicsCompressorNode, GainNode];

    switch (parameterId) {
      case 'threshold':
        compressor.threshold.value = value;
        break;
      case 'ratio':
        compressor.ratio.value = value;
        break;
      case 'attack':
        compressor.attack.value = value / 1000;
        break;
      case 'release':
        compressor.release.value = value / 1000;
        break;
      case 'knee':
        compressor.knee.value = value;
        break;
      case 'makeupGain':
        makeupGain.gain.value = this.dbToLinear(value);
        break;
    }
  }

  private updateReverbParameter(nodes: AudioNode[], parameterId: string, value: number) {
    // Reverb parameters would require regenerating the impulse response
    // This is a simplified implementation
    const [, wetGain, dryGain] = nodes as [ConvolverNode, GainNode, GainNode];

    switch (parameterId) {
      case 'wetLevel':
        wetGain.gain.value = value;
        break;
      case 'dryLevel':
        dryGain.gain.value = value;
        break;
    }
  }

  private updateDelayParameter(nodes: AudioNode[], parameterId: string, value: number) {
    const [delay, feedback, wetGain, dryGain, highCut, lowCut] = nodes as [
      DelayNode, GainNode, GainNode, GainNode, BiquadFilterNode, BiquadFilterNode
    ];

    switch (parameterId) {
      case 'delayTime':
        delay.delayTime.value = value / 1000;
        break;
      case 'feedback':
        feedback.gain.value = value;
        break;
      case 'wetLevel':
        wetGain.gain.value = value;
        break;
      case 'dryLevel':
        dryGain.gain.value = value;
        break;
      case 'highCut':
        highCut.frequency.value = value;
        break;
      case 'lowCut':
        lowCut.frequency.value = value;
        break;
    }
  }

  private updateChorusParameter(nodes: AudioNode[], parameterId: string, value: number) {
    // Chorus parameter updates would require rebuilding the effect
    // This is a simplified implementation
  }

  private updateDistortionParameter(nodes: AudioNode[], parameterId: string, value: number) {
    const [inputGain, waveshaper, toneFilter, outputGain] = nodes as [
      GainNode, WaveShaperNode, BiquadFilterNode, GainNode
    ];

    switch (parameterId) {
      case 'drive':
        inputGain.gain.value = this.dbToLinear(value);
        break;
      case 'tone':
        toneFilter.frequency.value = 1000 + (value * 9000);
        break;
      case 'level':
        outputGain.gain.value = value;
        break;
    }
  }

  private updateEffectBypass(effectId: string, bypassed: boolean) {
    // Implementation would involve routing around the effect
    // This is a simplified version
  }

  private disconnectAllEffects() {
    this.effectNodes.forEach(nodes => {
      nodes.forEach(node => {
        try {
          node.disconnect();
        } catch (e) {
          // Node might already be disconnected
        }
      });
    });
    this.effectNodes.clear();
  }

  private dbToLinear(db: number): number {
    return Math.pow(10, db / 20);
  }

  private linearToDb(linear: number): number {
    return 20 * Math.log10(Math.max(0.0001, linear));
  }

  public connect(source: AudioNode): AudioNode {
    source.connect(this.inputNode);
    return this.outputNode;
  }

  public disconnect() {
    this.disconnectAllEffects();
    this.inputNode.disconnect();
    this.outputNode.disconnect();
  }

  public getAnalyserNode(): AnalyserNode {
    return this.analyserNode;
  }

  public getPerformanceMetrics() {
    return {
      cpuUsage: this.cpuUsageHistory.slice(-60), // Last 60 samples
      latency: this.latencyHistory.slice(-60),
      activeEffects: this.effectChain.filter(id => {
        const effect = this.effects.get(id);
        return effect?.enabled && !effect?.bypassed;
      }).length,
      totalEffects: this.effects.size
    };
  }
}
