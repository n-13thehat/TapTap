/**
 * Audio Processor Worklet
 * High-performance audio processing using AudioWorklet
 */

class AudioProcessorWorklet extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    // Initialize processor options
    this.bufferSize = options.processorOptions?.bufferSize || 512;
    this.sampleRate = sampleRate;
    
    // Processing state
    this.processedSamples = 0;
    this.processingTime = 0;
    this.lastProcessTime = 0;
    
    // Audio effects and processing
    this.effects = {
      gain: 1.0,
      lowpass: null,
      highpass: null,
      compressor: null,
      reverb: null,
      delay: null
    };
    
    // Performance monitoring
    this.performanceMetrics = {
      cpuUsage: 0,
      processingLatency: 0,
      bufferUnderruns: 0,
      dropouts: 0
    };
    
    // Initialize filters
    this.initializeFilters();
    
    // Set up message handling
    this.port.onmessage = this.handleMessage.bind(this);
  }

  initializeFilters() {
    // Initialize biquad filters for EQ
    this.filters = {
      lowpass: this.createBiquadFilter('lowpass', 20000, 0.707),
      highpass: this.createBiquadFilter('highpass', 20, 0.707),
      peaking: this.createBiquadFilter('peaking', 1000, 1, 0)
    };
    
    // Initialize compressor
    this.compressor = {
      threshold: -24, // dB
      ratio: 4,
      attack: 0.003, // seconds
      release: 0.1, // seconds
      knee: 2, // dB
      makeup: 0, // dB
      envelope: 0
    };
    
    // Initialize delay
    this.delay = {
      delayTime: 0.1, // seconds
      feedback: 0.3,
      wetLevel: 0.2,
      buffer: new Float32Array(Math.floor(this.sampleRate * 1.0)), // 1 second max delay
      writeIndex: 0
    };
  }

  createBiquadFilter(type, frequency, Q, gain = 0) {
    // Simplified biquad filter implementation
    const filter = {
      type,
      frequency,
      Q,
      gain,
      x1: 0, x2: 0,
      y1: 0, y2: 0,
      b0: 1, b1: 0, b2: 0,
      a1: 0, a2: 0
    };
    
    this.updateFilterCoefficients(filter);
    return filter;
  }

  updateFilterCoefficients(filter) {
    const omega = 2 * Math.PI * filter.frequency / this.sampleRate;
    const sin = Math.sin(omega);
    const cos = Math.cos(omega);
    const alpha = sin / (2 * filter.Q);
    const A = Math.pow(10, filter.gain / 40);
    
    let b0, b1, b2, a0, a1, a2;
    
    switch (filter.type) {
      case 'lowpass':
        b0 = (1 - cos) / 2;
        b1 = 1 - cos;
        b2 = (1 - cos) / 2;
        a0 = 1 + alpha;
        a1 = -2 * cos;
        a2 = 1 - alpha;
        break;
        
      case 'highpass':
        b0 = (1 + cos) / 2;
        b1 = -(1 + cos);
        b2 = (1 + cos) / 2;
        a0 = 1 + alpha;
        a1 = -2 * cos;
        a2 = 1 - alpha;
        break;
        
      case 'peaking':
        b0 = 1 + alpha * A;
        b1 = -2 * cos;
        b2 = 1 - alpha * A;
        a0 = 1 + alpha / A;
        a1 = -2 * cos;
        a2 = 1 - alpha / A;
        break;
        
      default:
        b0 = 1; b1 = 0; b2 = 0;
        a0 = 1; a1 = 0; a2 = 0;
    }
    
    // Normalize coefficients
    filter.b0 = b0 / a0;
    filter.b1 = b1 / a0;
    filter.b2 = b2 / a0;
    filter.a1 = a1 / a0;
    filter.a2 = a2 / a0;
  }

  applyBiquadFilter(input, filter) {
    const output = filter.b0 * input + filter.b1 * filter.x1 + filter.b2 * filter.x2
                  - filter.a1 * filter.y1 - filter.a2 * filter.y2;
    
    // Update delay line
    filter.x2 = filter.x1;
    filter.x1 = input;
    filter.y2 = filter.y1;
    filter.y1 = output;
    
    return output;
  }

  applyCompressor(input) {
    const inputLevel = Math.abs(input);
    const inputLevelDb = inputLevel > 0 ? 20 * Math.log10(inputLevel) : -100;
    
    // Calculate gain reduction
    let gainReduction = 0;
    if (inputLevelDb > this.compressor.threshold) {
      const overThreshold = inputLevelDb - this.compressor.threshold;
      gainReduction = overThreshold * (1 - 1 / this.compressor.ratio);
    }
    
    // Apply attack/release envelope
    const targetEnvelope = gainReduction;
    const rate = targetEnvelope > this.compressor.envelope ? 
                 this.compressor.attack : this.compressor.release;
    
    this.compressor.envelope += (targetEnvelope - this.compressor.envelope) * rate;
    
    // Convert back to linear gain
    const gainLinear = Math.pow(10, (-this.compressor.envelope + this.compressor.makeup) / 20);
    
    return input * gainLinear;
  }

  applyDelay(input) {
    const delayedSample = this.delay.buffer[this.delay.writeIndex];
    
    // Calculate feedback
    const feedbackSample = delayedSample * this.delay.feedback;
    
    // Write new sample with feedback
    this.delay.buffer[this.delay.writeIndex] = input + feedbackSample;
    
    // Update write index
    this.delay.writeIndex = (this.delay.writeIndex + 1) % this.delay.buffer.length;
    
    // Mix wet and dry signals
    return input + delayedSample * this.delay.wetLevel;
  }

  processAudioSample(input) {
    let output = input;
    
    // Apply gain
    output *= this.effects.gain;
    
    // Apply filters
    if (this.effects.highpass) {
      output = this.applyBiquadFilter(output, this.filters.highpass);
    }
    
    if (this.effects.lowpass) {
      output = this.applyBiquadFilter(output, this.filters.lowpass);
    }
    
    // Apply compressor
    if (this.effects.compressor) {
      output = this.applyCompressor(output);
    }
    
    // Apply delay
    if (this.effects.delay) {
      output = this.applyDelay(output);
    }
    
    // Prevent clipping
    output = Math.max(-1, Math.min(1, output));
    
    return output;
  }

  process(inputs, outputs, parameters) {
    const startTime = performance.now();
    
    const input = inputs[0];
    const output = outputs[0];
    
    // Check if we have input
    if (input.length === 0) {
      this.performanceMetrics.bufferUnderruns++;
      return true;
    }
    
    // Process each channel
    for (let channel = 0; channel < output.length; channel++) {
      const inputChannel = input[channel] || new Float32Array(128);
      const outputChannel = output[channel];
      
      // Process each sample
      for (let sample = 0; sample < outputChannel.length; sample++) {
        outputChannel[sample] = this.processAudioSample(inputChannel[sample] || 0);
      }
    }
    
    // Update performance metrics
    const endTime = performance.now();
    this.processingTime = endTime - startTime;
    this.processedSamples += output[0].length;
    
    // Calculate CPU usage (simplified)
    const frameTime = (output[0].length / this.sampleRate) * 1000; // ms
    this.performanceMetrics.cpuUsage = (this.processingTime / frameTime) * 100;
    
    // Send metrics periodically
    if (this.processedSamples % (this.sampleRate * 0.1) === 0) { // Every 100ms
      this.port.postMessage({
        type: 'metrics',
        metrics: {
          ...this.performanceMetrics,
          processingTime: this.processingTime,
          processedSamples: this.processedSamples
        }
      });
    }
    
    return true;
  }

  handleMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'setGain':
        this.effects.gain = data.gain;
        break;
        
      case 'setFilter':
        if (data.filterType && this.filters[data.filterType]) {
          this.filters[data.filterType].frequency = data.frequency || this.filters[data.filterType].frequency;
          this.filters[data.filterType].Q = data.Q || this.filters[data.filterType].Q;
          this.filters[data.filterType].gain = data.gain || this.filters[data.filterType].gain;
          this.updateFilterCoefficients(this.filters[data.filterType]);
        }
        this.effects[data.filterType] = data.enabled;
        break;
        
      case 'setCompressor':
        Object.assign(this.compressor, data);
        this.effects.compressor = data.enabled;
        break;
        
      case 'setDelay':
        Object.assign(this.delay, data);
        this.effects.delay = data.enabled;
        break;
        
      case 'getMetrics':
        this.port.postMessage({
          type: 'metrics',
          metrics: {
            ...this.performanceMetrics,
            processingTime: this.processingTime,
            processedSamples: this.processedSamples
          }
        });
        break;
        
      case 'reset':
        // Reset all processing state
        this.processedSamples = 0;
        this.processingTime = 0;
        this.performanceMetrics = {
          cpuUsage: 0,
          processingLatency: 0,
          bufferUnderruns: 0,
          dropouts: 0
        };
        
        // Reset filter states
        Object.values(this.filters).forEach(filter => {
          filter.x1 = filter.x2 = filter.y1 = filter.y2 = 0;
        });
        
        // Reset compressor envelope
        this.compressor.envelope = 0;
        
        // Clear delay buffer
        this.delay.buffer.fill(0);
        this.delay.writeIndex = 0;
        break;
        
      default:
        console.warn('Unknown message type:', type);
    }
  }

  static get parameterDescriptors() {
    return [
      {
        name: 'gain',
        defaultValue: 1.0,
        minValue: 0.0,
        maxValue: 2.0,
        automationRate: 'a-rate'
      },
      {
        name: 'filterFrequency',
        defaultValue: 1000,
        minValue: 20,
        maxValue: 20000,
        automationRate: 'a-rate'
      },
      {
        name: 'filterQ',
        defaultValue: 1.0,
        minValue: 0.1,
        maxValue: 30.0,
        automationRate: 'a-rate'
      }
    ];
  }
}

// Register the processor
registerProcessor('audio-processor', AudioProcessorWorklet);
