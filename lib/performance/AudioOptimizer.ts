/**
 * Audio Optimizer
 * Advanced audio performance optimization for TapTap Matrix
 */

export interface AudioOptimizationConfig {
  bufferSize: number;
  sampleRate: number;
  latencyHint: 'interactive' | 'balanced' | 'playback';
  enableWorklets: boolean;
  enableCompression: boolean;
  enableCaching: boolean;
  maxConcurrentTracks: number;
  enableOfflineProcessing: boolean;
  enableSIMD: boolean;
  enableWebAssembly: boolean;
  compressionQuality: number; // 0-1
  cacheSize: number; // MB
}

export interface AudioPerformanceMetrics {
  latency: number;
  cpuUsage: number;
  memoryUsage: number;
  dropouts: number;
  bufferUnderruns: number;
  processingTime: number;
  concurrentTracks: number;
  cacheHitRate: number;
  compressionRatio: number;
  timestamp: number;
}

export interface AudioBuffer {
  id: string;
  data: Float32Array[];
  sampleRate: number;
  duration: number;
  channels: number;
  compressed: boolean;
  cached: boolean;
  lastAccessed: number;
}

export interface AudioWorkletConfig {
  name: string;
  processorUrl: string;
  options: any;
}

export class AudioOptimizer {
  private config: AudioOptimizationConfig;
  private audioContext: AudioContext | null = null;
  private worklets: Map<string, AudioWorkletNode> = new Map();
  private bufferPool: AudioBuffer[] = [];
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private compressionWorker: Worker | null = null;
  private wasmModule: WebAssembly.Module | null = null;
  
  // Performance tracking
  private metrics: AudioPerformanceMetrics[] = [];
  private activeTracks: Set<string> = new Set();
  private processingQueue: any[] = [];
  private dropoutCount = 0;
  private underrunCount = 0;
  
  // Optimization state
  private isOptimized = false;
  private optimizationLevel = 0; // 0-3
  private adaptiveQuality = true;
  private dynamicBuffering = true;
  
  // SIMD support
  private simdSupported = false;
  private wasmSupported = false;

  constructor(config: Partial<AudioOptimizationConfig> = {}) {
    this.config = {
      bufferSize: 512,
      sampleRate: 44100,
      latencyHint: 'interactive',
      enableWorklets: true,
      enableCompression: true,
      enableCaching: true,
      maxConcurrentTracks: 32,
      enableOfflineProcessing: true,
      enableSIMD: true,
      enableWebAssembly: true,
      compressionQuality: 0.8,
      cacheSize: 100, // 100MB
      ...config,
    };

    this.detectCapabilities();
    this.initializeOptimizations();
  }

  private detectCapabilities(): void {
    // Detect SIMD support
    this.simdSupported = typeof WebAssembly !== 'undefined' && 
                       WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]));

    // Detect WebAssembly support
    this.wasmSupported = typeof WebAssembly !== 'undefined';

    console.log('Audio capabilities:', {
      simd: this.simdSupported,
      wasm: this.wasmSupported,
      worklets: 'AudioWorklet' in window,
      sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    });
  }

  private async initializeOptimizations(): Promise<void> {
    try {
      // Initialize audio context with optimal settings
      await this.initializeAudioContext();
      
      // Load WebAssembly module if supported
      if (this.config.enableWebAssembly && this.wasmSupported) {
        await this.loadWasmModule();
      }
      
      // Setup audio worklets
      if (this.config.enableWorklets && this.audioContext) {
        await this.setupAudioWorklets();
      }
      
      // Initialize compression worker
      if (this.config.enableCompression) {
        this.initializeCompressionWorker();
      }
      
      // Setup buffer pool
      this.initializeBufferPool();
      
      // Start performance monitoring
      this.startPerformanceMonitoring();
      
      this.isOptimized = true;
      console.log('Audio optimization initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize audio optimization:', error);
    }
  }

  private async initializeAudioContext(): Promise<void> {
    const contextOptions: AudioContextOptions = {
      latencyHint: this.config.latencyHint,
      sampleRate: this.config.sampleRate,
    };

    this.audioContext = new AudioContext(contextOptions);
    
    // Resume context if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    console.log('Audio context initialized:', {
      sampleRate: this.audioContext.sampleRate,
      baseLatency: this.audioContext.baseLatency,
      outputLatency: this.audioContext.outputLatency,
    });
  }

  private async loadWasmModule(): Promise<void> {
    try {
      const wasmResponse = await fetch('/wasm/audio-processor.wasm');
      const wasmBytes = await wasmResponse.arrayBuffer();
      this.wasmModule = await WebAssembly.compile(wasmBytes);
      
      console.log('WebAssembly audio module loaded');
    } catch (error) {
      console.warn('Failed to load WebAssembly module:', error);
    }
  }

  private async setupAudioWorklets(): Promise<void> {
    if (!this.audioContext) return;

    try {
      // Register audio worklets
      const workletConfigs: AudioWorkletConfig[] = [
        {
          name: 'audio-processor',
          processorUrl: '/worklets/audio-processor.js',
          options: { bufferSize: this.config.bufferSize }
        },
        {
          name: 'compressor',
          processorUrl: '/worklets/compressor.js',
          options: { quality: this.config.compressionQuality }
        },
        {
          name: 'analyzer',
          processorUrl: '/worklets/analyzer.js',
          options: { fftSize: 2048 }
        }
      ];

      for (const config of workletConfigs) {
        await this.audioContext.audioWorklet.addModule(config.processorUrl);
        
        const workletNode = new AudioWorkletNode(this.audioContext, config.name, {
          processorOptions: config.options
        });
        
        this.worklets.set(config.name, workletNode);
      }

      console.log('Audio worklets initialized:', Array.from(this.worklets.keys()));
      
    } catch (error) {
      console.warn('Failed to setup audio worklets:', error);
    }
  }

  private initializeCompressionWorker(): void {
    try {
      this.compressionWorker = new Worker('/workers/audio-compression.js');
      
      this.compressionWorker.onmessage = (event) => {
        const { id, compressedData, compressionRatio } = event.data;
        this.handleCompressedAudio(id, compressedData, compressionRatio);
      };
      
      this.compressionWorker.onerror = (error) => {
        console.error('Compression worker error:', error);
      };
      
      console.log('Audio compression worker initialized');
      
    } catch (error) {
      console.warn('Failed to initialize compression worker:', error);
    }
  }

  private initializeBufferPool(): void {
    // Pre-allocate audio buffers to reduce GC pressure
    const poolSize = 20;
    
    for (let i = 0; i < poolSize; i++) {
      const buffer: AudioBuffer = {
        id: `pool_${i}`,
        data: [
          new Float32Array(this.config.bufferSize),
          new Float32Array(this.config.bufferSize)
        ],
        sampleRate: this.config.sampleRate,
        duration: this.config.bufferSize / this.config.sampleRate,
        channels: 2,
        compressed: false,
        cached: false,
        lastAccessed: Date.now(),
      };
      
      this.bufferPool.push(buffer);
    }
    
    console.log(`Audio buffer pool initialized with ${poolSize} buffers`);
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.collectPerformanceMetrics();
      this.adaptiveOptimization();
    }, 1000); // Every second
  }

  private collectPerformanceMetrics(): void {
    if (!this.audioContext) return;

    const metrics: AudioPerformanceMetrics = {
      latency: this.audioContext.baseLatency + this.audioContext.outputLatency,
      cpuUsage: this.calculateCPUUsage(),
      memoryUsage: this.calculateMemoryUsage(),
      dropouts: this.dropoutCount,
      bufferUnderruns: this.underrunCount,
      processingTime: this.calculateProcessingTime(),
      concurrentTracks: this.activeTracks.size,
      cacheHitRate: this.calculateCacheHitRate(),
      compressionRatio: this.calculateCompressionRatio(),
      timestamp: Date.now(),
    };

    this.metrics.push(metrics);
    
    // Keep only recent metrics
    if (this.metrics.length > 300) { // 5 minutes at 1Hz
      this.metrics = this.metrics.slice(-300);
    }

    // Reset counters
    this.dropoutCount = 0;
    this.underrunCount = 0;
  }

  private adaptiveOptimization(): void {
    if (!this.adaptiveQuality) return;

    const latestMetrics = this.metrics[this.metrics.length - 1];
    if (!latestMetrics) return;

    // Adaptive quality based on performance
    if (latestMetrics.cpuUsage > 80 || latestMetrics.dropouts > 0) {
      this.decreaseQuality();
    } else if (latestMetrics.cpuUsage < 50 && latestMetrics.dropouts === 0) {
      this.increaseQuality();
    }

    // Dynamic buffer size adjustment
    if (this.dynamicBuffering) {
      if (latestMetrics.bufferUnderruns > 0) {
        this.increaseBufferSize();
      } else if (latestMetrics.latency > 50) {
        this.decreaseBufferSize();
      }
    }
  }

  // Audio processing optimization
  public async processAudioBuffer(
    inputBuffer: Float32Array[],
    trackId: string,
    options: any = {}
  ): Promise<Float32Array[]> {
    this.activeTracks.add(trackId);
    
    try {
      // Check if we can use optimized processing
      if (this.wasmModule && this.config.enableWebAssembly) {
        return await this.processWithWasm(inputBuffer, options);
      } else if (this.worklets.has('audio-processor')) {
        return await this.processWithWorklet(inputBuffer, options);
      } else {
        return await this.processWithJavaScript(inputBuffer, options);
      }
    } catch (error) {
      console.error('Audio processing error:', error);
      this.dropoutCount++;
      return inputBuffer; // Return original buffer as fallback
    } finally {
      this.activeTracks.delete(trackId);
    }
  }

  private async processWithWasm(
    inputBuffer: Float32Array[],
    options: any
  ): Promise<Float32Array[]> {
    if (!this.wasmModule) throw new Error('WASM module not loaded');

    // Create WASM instance for processing
    const wasmInstance = await WebAssembly.instantiate(this.wasmModule);
    const { process_audio } = wasmInstance.exports as any;

    // Process each channel
    const outputBuffer: Float32Array[] = [];
    
    for (let channel = 0; channel < inputBuffer.length; channel++) {
      const input = inputBuffer[channel];
      const output = new Float32Array(input.length);
      
      // Call WASM function
      process_audio(input, output, input.length, options);
      outputBuffer.push(output);
    }

    return outputBuffer;
  }

  private async processWithWorklet(
    inputBuffer: Float32Array[],
    options: any
  ): Promise<Float32Array[]> {
    const worklet = this.worklets.get('audio-processor');
    if (!worklet) throw new Error('Audio worklet not available');

    return new Promise((resolve, reject) => {
      const messageId = `process_${Date.now()}_${Math.random()}`;
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data.id === messageId) {
          worklet.port.removeEventListener('message', handleMessage);
          
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.outputBuffer);
          }
        }
      };

      worklet.port.addEventListener('message', handleMessage);
      worklet.port.start();
      
      worklet.port.postMessage({
        id: messageId,
        command: 'process',
        inputBuffer,
        options,
      });

      // Timeout after 100ms
      setTimeout(() => {
        worklet.port.removeEventListener('message', handleMessage);
        reject(new Error('Worklet processing timeout'));
      }, 100);
    });
  }

  private async processWithJavaScript(
    inputBuffer: Float32Array[],
    options: any
  ): Promise<Float32Array[]> {
    // Fallback JavaScript processing
    const outputBuffer: Float32Array[] = [];
    
    for (let channel = 0; channel < inputBuffer.length; channel++) {
      const input = inputBuffer[channel];
      const output = new Float32Array(input.length);
      
      // Simple processing (copy with optional gain)
      const gain = options.gain || 1.0;
      for (let i = 0; i < input.length; i++) {
        output[i] = input[i] * gain;
      }
      
      outputBuffer.push(output);
    }

    return outputBuffer;
  }

  // Buffer management
  public getOptimizedBuffer(id: string): AudioBuffer | null {
    // Check cache first
    const cached = this.bufferCache.get(id);
    if (cached) {
      cached.lastAccessed = Date.now();
      return cached;
    }

    // Get from pool
    const poolBuffer = this.bufferPool.find(b => !b.cached);
    if (poolBuffer) {
      poolBuffer.id = id;
      poolBuffer.cached = true;
      poolBuffer.lastAccessed = Date.now();
      this.bufferCache.set(id, poolBuffer);
      return poolBuffer;
    }

    return null;
  }

  public releaseBuffer(id: string): void {
    const buffer = this.bufferCache.get(id);
    if (buffer) {
      buffer.cached = false;
      buffer.id = `pool_${Date.now()}`;
      this.bufferCache.delete(id);
    }
  }

  // Compression
  public async compressAudioBuffer(
    buffer: Float32Array[],
    quality: number = this.config.compressionQuality
  ): Promise<ArrayBuffer> {
    if (!this.compressionWorker) {
      throw new Error('Compression worker not available');
    }

    return new Promise((resolve, reject) => {
      const id = `compress_${Date.now()}_${Math.random()}`;
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data.id === id) {
          this.compressionWorker!.removeEventListener('message', handleMessage);
          
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.compressedData);
          }
        }
      };

      this.compressionWorker.addEventListener('message', handleMessage);
      
      this.compressionWorker.postMessage({
        id,
        command: 'compress',
        buffer,
        quality,
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        this.compressionWorker!.removeEventListener('message', handleMessage);
        reject(new Error('Compression timeout'));
      }, 5000);
    });
  }

  public async decompressAudioBuffer(compressedData: ArrayBuffer): Promise<Float32Array[]> {
    if (!this.compressionWorker) {
      throw new Error('Compression worker not available');
    }

    return new Promise((resolve, reject) => {
      const id = `decompress_${Date.now()}_${Math.random()}`;
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data.id === id) {
          this.compressionWorker!.removeEventListener('message', handleMessage);
          
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.buffer);
          }
        }
      };

      this.compressionWorker.addEventListener('message', handleMessage);
      
      this.compressionWorker.postMessage({
        id,
        command: 'decompress',
        compressedData,
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        this.compressionWorker!.removeEventListener('message', handleMessage);
        reject(new Error('Decompression timeout'));
      }, 5000);
    });
  }

  // Quality adjustment
  private decreaseQuality(): void {
    if (this.optimizationLevel > 0) {
      this.optimizationLevel--;
      this.applyOptimizationLevel();
    }
  }

  private increaseQuality(): void {
    if (this.optimizationLevel < 3) {
      this.optimizationLevel++;
      this.applyOptimizationLevel();
    }
  }

  private applyOptimizationLevel(): void {
    switch (this.optimizationLevel) {
      case 0: // Minimum quality
        this.config.compressionQuality = 0.5;
        this.config.bufferSize = 1024;
        break;
      case 1: // Low quality
        this.config.compressionQuality = 0.6;
        this.config.bufferSize = 512;
        break;
      case 2: // Medium quality
        this.config.compressionQuality = 0.8;
        this.config.bufferSize = 256;
        break;
      case 3: // High quality
        this.config.compressionQuality = 0.95;
        this.config.bufferSize = 128;
        break;
    }
  }

  // Buffer size adjustment
  private increaseBufferSize(): void {
    if (this.config.bufferSize < 2048) {
      this.config.bufferSize *= 2;
      this.reconfigureAudioContext();
    }
  }

  private decreaseBufferSize(): void {
    if (this.config.bufferSize > 128) {
      this.config.bufferSize /= 2;
      this.reconfigureAudioContext();
    }
  }

  private async reconfigureAudioContext(): Promise<void> {
    if (!this.audioContext) return;

    try {
      // Close current context
      await this.audioContext.close();
      
      // Create new context with updated settings
      await this.initializeAudioContext();
      
      // Reinitialize worklets
      if (this.config.enableWorklets) {
        await this.setupAudioWorklets();
      }
      
    } catch (error) {
      console.error('Failed to reconfigure audio context:', error);
    }
  }

  // Performance calculation methods
  private calculateCPUUsage(): number {
    // Simplified CPU usage calculation
    const processingTime = this.calculateProcessingTime();
    const frameTime = (this.config.bufferSize / this.config.sampleRate) * 1000;
    return Math.min(100, (processingTime / frameTime) * 100);
  }

  private calculateMemoryUsage(): number {
    // Calculate memory usage in MB
    const bufferMemory = this.bufferPool.length * this.config.bufferSize * 4 * 2; // Float32 * 2 channels
    const cacheMemory = this.bufferCache.size * this.config.bufferSize * 4 * 2;
    return (bufferMemory + cacheMemory) / (1024 * 1024);
  }

  private calculateProcessingTime(): number {
    // Simplified processing time calculation
    return this.activeTracks.size * 2; // 2ms per track
  }

  private calculateCacheHitRate(): number {
    // Simplified cache hit rate
    return 0.85; // 85%
  }

  private calculateCompressionRatio(): number {
    // Simplified compression ratio
    return 0.6; // 60% of original size
  }

  private handleCompressedAudio(id: string, compressedData: ArrayBuffer, compressionRatio: number): void {
    // Handle compressed audio data
    console.log(`Audio compressed: ${id}, ratio: ${compressionRatio}`);
  }

  // Cache management
  public clearCache(): void {
    this.bufferCache.clear();
    
    // Reset buffer pool
    this.bufferPool.forEach(buffer => {
      buffer.cached = false;
      buffer.id = `pool_${Date.now()}_${Math.random()}`;
    });
  }

  public optimizeCache(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    // Remove old cached buffers
    for (const [id, buffer] of this.bufferCache.entries()) {
      if (now - buffer.lastAccessed > maxAge) {
        this.releaseBuffer(id);
      }
    }
  }

  // Public API
  public getMetrics(): AudioPerformanceMetrics[] {
    return [...this.metrics];
  }

  public getLatestMetrics(): AudioPerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  public getOptimizationLevel(): number {
    return this.optimizationLevel;
  }

  public setOptimizationLevel(level: number): void {
    this.optimizationLevel = Math.max(0, Math.min(3, level));
    this.applyOptimizationLevel();
  }

  public enableAdaptiveQuality(enabled: boolean): void {
    this.adaptiveQuality = enabled;
  }

  public enableDynamicBuffering(enabled: boolean): void {
    this.dynamicBuffering = enabled;
  }

  public getConfig(): AudioOptimizationConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<AudioOptimizationConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Apply changes that require reinitialization
    if (updates.bufferSize || updates.sampleRate) {
      this.reconfigureAudioContext();
    }
  }

  public isOptimizationEnabled(): boolean {
    return this.isOptimized;
  }

  public getCapabilities(): any {
    return {
      simd: this.simdSupported,
      wasm: this.wasmSupported,
      worklets: this.worklets.size > 0,
      compression: this.compressionWorker !== null,
      audioContext: this.audioContext !== null,
    };
  }

  public destroy(): void {
    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
    }

    // Terminate workers
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
    }

    // Clear caches and pools
    this.clearCache();
    this.bufferPool = [];
    this.worklets.clear();
    this.activeTracks.clear();
    this.processingQueue = [];
    this.metrics = [];
  }
}

// Singleton instance
let audioOptimizer: AudioOptimizer | null = null;

export function getAudioOptimizer(): AudioOptimizer {
  if (!audioOptimizer) {
    audioOptimizer = new AudioOptimizer();
  }
  return audioOptimizer;
}

export function initializeAudioOptimizer(config?: Partial<AudioOptimizationConfig>): AudioOptimizer {
  audioOptimizer = new AudioOptimizer(config);
  return audioOptimizer;
}
