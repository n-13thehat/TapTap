/**
 * Advanced Audio Visualizer
 * Real-time audio visualization with multiple display modes
 */

export interface VisualizationConfig {
  type: 'spectrum' | 'waveform' | 'circular' | '3d' | 'particle' | 'oscilloscope';
  fftSize: number;
  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;
  colorScheme: ColorScheme;
  responsive: boolean;
  showPeaks: boolean;
  showGrid: boolean;
  showLabels: boolean;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  grid: string;
  text: string;
  gradient?: string[];
}

export interface VisualizationData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  peaks: number[];
  rms: number;
  peak: number;
  timestamp: number;
}

export class AdvancedVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private source: MediaElementAudioSourceNode | null = null;
  private animationId: number | null = null;
  
  private config: VisualizationConfig;
  private frequencyData: Uint8Array;
  private timeData: Uint8Array;
  private peaks: number[] = [];
  private peakHoldTime = 30; // frames
  private peakDecayRate = 0.95;
  
  // 3D visualization properties
  private rotationX = 0;
  private rotationY = 0;
  private rotationZ = 0;
  
  // Particle system properties
  private particles: Particle[] = [];
  private maxParticles = 100;
  
  constructor(canvas: HTMLCanvasElement, audioElement: HTMLAudioElement, config: Partial<VisualizationConfig> = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    // Initialize audio context
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    
    // Default configuration
    this.config = {
      type: 'spectrum',
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      minDecibels: -90,
      maxDecibels: -10,
      colorScheme: {
        primary: '#14b8a6',
        secondary: '#06b6d4',
        accent: '#f59e0b',
        background: '#0f172a',
        grid: '#334155',
        text: '#e2e8f0',
        gradient: ['#14b8a6', '#06b6d4', '#8b5cf6', '#f59e0b']
      },
      responsive: true,
      showPeaks: true,
      showGrid: true,
      showLabels: true,
      ...config
    };
    
    // Configure analyser
    this.analyser.fftSize = this.config.fftSize;
    this.analyser.smoothingTimeConstant = this.config.smoothingTimeConstant;
    this.analyser.minDecibels = this.config.minDecibels;
    this.analyser.maxDecibels = this.config.maxDecibels;
    
    // Initialize data arrays
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeData = new Uint8Array(this.analyser.fftSize);
    this.peaks = new Array(this.analyser.frequencyBinCount).fill(0);
    
    // Connect audio source
    this.connectAudioSource(audioElement);
    
    // Initialize particles
    this.initializeParticles();
    
    // Handle canvas resize
    if (this.config.responsive) {
      this.setupResponsiveCanvas();
    }
  }

  private connectAudioSource(audioElement: HTMLAudioElement) {
    try {
      if (this.source) {
        this.source.disconnect();
      }
      
      this.source = this.audioContext.createMediaElementSource(audioElement);
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
    } catch (error) {
      console.warn('Failed to connect audio source:', error);
    }
  }

  private setupResponsiveCanvas() {
    const resizeObserver = new ResizeObserver(() => {
      this.resizeCanvas();
    });
    resizeObserver.observe(this.canvas.parentElement!);
  }

  private resizeCanvas() {
    const parent = this.canvas.parentElement!;
    const rect = parent.getBoundingClientRect();
    
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  private initializeParticles() {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(new Particle(
        Math.random() * this.canvas.width,
        Math.random() * this.canvas.height,
        this.config.colorScheme
      ));
    }
  }

  public start() {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    this.animate();
  }

  public stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public updateConfig(newConfig: Partial<VisualizationConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    // Update analyser settings
    this.analyser.fftSize = this.config.fftSize;
    this.analyser.smoothingTimeConstant = this.config.smoothingTimeConstant;
    this.analyser.minDecibels = this.config.minDecibels;
    this.analyser.maxDecibels = this.config.maxDecibels;
    
    // Reinitialize data arrays if FFT size changed
    if (newConfig.fftSize) {
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyser.fftSize);
      this.peaks = new Array(this.analyser.frequencyBinCount).fill(0);
    }
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    
    // Get audio data
    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeData);
    
    // Update peaks
    this.updatePeaks();
    
    // Clear canvas
    this.clearCanvas();
    
    // Draw visualization based on type
    switch (this.config.type) {
      case 'spectrum':
        this.drawSpectrum();
        break;
      case 'waveform':
        this.drawWaveform();
        break;
      case 'circular':
        this.drawCircular();
        break;
      case '3d':
        this.draw3D();
        break;
      case 'particle':
        this.drawParticles();
        break;
      case 'oscilloscope':
        this.drawOscilloscope();
        break;
    }
    
    // Draw grid and labels if enabled
    if (this.config.showGrid) {
      this.drawGrid();
    }
    
    if (this.config.showLabels) {
      this.drawLabels();
    }
  };

  private updatePeaks() {
    for (let i = 0; i < this.frequencyData.length; i++) {
      const current = this.frequencyData[i];
      
      if (current > this.peaks[i]) {
        this.peaks[i] = current;
      } else {
        this.peaks[i] *= this.peakDecayRate;
      }
    }
  }

  private clearCanvas() {
    this.ctx.fillStyle = this.config.colorScheme.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawSpectrum() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const barWidth = width / this.frequencyData.length;
    
    // Create gradient
    const gradient = this.ctx.createLinearGradient(0, height, 0, 0);
    if (this.config.colorScheme.gradient) {
      this.config.colorScheme.gradient.forEach((color, index) => {
        gradient.addColorStop(index / (this.config.colorScheme.gradient!.length - 1), color);
      });
    } else {
      gradient.addColorStop(0, this.config.colorScheme.primary);
      gradient.addColorStop(1, this.config.colorScheme.secondary);
    }
    
    this.ctx.fillStyle = gradient;
    
    // Draw frequency bars
    for (let i = 0; i < this.frequencyData.length; i++) {
      const barHeight = (this.frequencyData[i] / 255) * height;
      const x = i * barWidth;
      const y = height - barHeight;
      
      this.ctx.fillRect(x, y, barWidth - 1, barHeight);
      
      // Draw peaks if enabled
      if (this.config.showPeaks) {
        const peakHeight = (this.peaks[i] / 255) * height;
        const peakY = height - peakHeight;
        
        this.ctx.fillStyle = this.config.colorScheme.accent;
        this.ctx.fillRect(x, peakY - 2, barWidth - 1, 2);
        this.ctx.fillStyle = gradient;
      }
    }
  }

  private drawWaveform() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerY = height / 2;
    
    this.ctx.strokeStyle = this.config.colorScheme.primary;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    
    for (let i = 0; i < this.timeData.length; i++) {
      const x = (i / this.timeData.length) * width;
      const y = centerY + ((this.timeData[i] - 128) / 128) * (height / 2);
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    this.ctx.stroke();
  }

  private drawCircular() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;
    
    const angleStep = (Math.PI * 2) / this.frequencyData.length;
    
    // Create radial gradient
    const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, this.config.colorScheme.primary);
    gradient.addColorStop(1, this.config.colorScheme.secondary);
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    
    for (let i = 0; i < this.frequencyData.length; i++) {
      const angle = i * angleStep;
      const barHeight = (this.frequencyData[i] / 255) * radius * 0.5;
      
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barHeight);
      const y2 = centerY + Math.sin(angle) * (radius + barHeight);
      
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
    }
    
    this.ctx.stroke();
  }

  private draw3D() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Update rotation
    this.rotationY += 0.01;
    
    // 3D projection parameters
    const perspective = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw 3D bars
    for (let i = 0; i < this.frequencyData.length; i += 4) { // Skip some for performance
      const barHeight = (this.frequencyData[i] / 255) * 200;
      const x = (i / this.frequencyData.length - 0.5) * 400;
      const z = 0;
      
      // 3D rotation
      const rotatedX = x * Math.cos(this.rotationY) - z * Math.sin(this.rotationY);
      const rotatedZ = x * Math.sin(this.rotationY) + z * Math.cos(this.rotationY);
      
      // Perspective projection
      const scale = perspective / (perspective + rotatedZ);
      const projectedX = centerX + rotatedX * scale;
      const projectedY = centerY;
      
      // Color based on distance
      const alpha = Math.max(0.3, scale);
      this.ctx.fillStyle = `rgba(20, 184, 166, ${alpha})`;
      
      // Draw bar
      const barWidth = 8 * scale;
      this.ctx.fillRect(
        projectedX - barWidth / 2,
        projectedY - barHeight * scale,
        barWidth,
        barHeight * scale
      );
    }
  }

  private drawParticles() {
    // Update particles based on audio data
    const avgFrequency = this.frequencyData.reduce((sum, val) => sum + val, 0) / this.frequencyData.length;
    const intensity = avgFrequency / 255;
    
    this.particles.forEach((particle, index) => {
      const frequencyIndex = Math.floor((index / this.particles.length) * this.frequencyData.length);
      const frequency = this.frequencyData[frequencyIndex] / 255;
      
      particle.update(frequency, intensity);
      particle.draw(this.ctx);
    });
  }

  private drawOscilloscope() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Draw multiple traces for stereo effect
    const traces = 2;
    const traceHeight = height / traces;
    
    for (let trace = 0; trace < traces; trace++) {
      const centerY = traceHeight * trace + traceHeight / 2;
      
      this.ctx.strokeStyle = trace === 0 ? this.config.colorScheme.primary : this.config.colorScheme.secondary;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      
      for (let i = 0; i < this.timeData.length; i++) {
        const x = (i / this.timeData.length) * width;
        const y = centerY + ((this.timeData[i] - 128) / 128) * (traceHeight / 3);
        
        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }
      
      this.ctx.stroke();
    }
  }

  private drawGrid() {
    this.ctx.strokeStyle = this.config.colorScheme.grid;
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([2, 2]);
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Horizontal lines
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * height;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }
    
    // Vertical lines
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }
    
    this.ctx.setLineDash([]);
  }

  private drawLabels() {
    this.ctx.fillStyle = this.config.colorScheme.text;
    this.ctx.font = '12px monospace';
    
    // Frequency labels for spectrum
    if (this.config.type === 'spectrum') {
      const sampleRate = this.audioContext.sampleRate;
      const nyquist = sampleRate / 2;
      
      const frequencies = [60, 250, 1000, 4000, 16000];
      frequencies.forEach(freq => {
        if (freq <= nyquist) {
          const x = (freq / nyquist) * this.canvas.width;
          this.ctx.fillText(`${freq}Hz`, x, this.canvas.height - 5);
        }
      });
    }
    
    // dB scale
    const dbValues = [-60, -40, -20, 0];
    dbValues.forEach((db, index) => {
      const y = (index / (dbValues.length - 1)) * this.canvas.height;
      this.ctx.fillText(`${db}dB`, 5, y + 15);
    });
  }

  public getVisualizationData(): VisualizationData {
    return {
      frequencyData: this.frequencyData,
      timeData: this.timeData,
      peaks: this.peaks,
      rms: this.calculateRMS(),
      peak: Math.max(...Array.from(this.frequencyData)),
      timestamp: Date.now()
    };
  }

  private calculateRMS(): number {
    let sum = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      const sample = (this.timeData[i] - 128) / 128;
      sum += sample * sample;
    }
    return Math.sqrt(sum / this.timeData.length);
  }

  public destroy() {
    this.stop();
    if (this.source) {
      this.source.disconnect();
    }
    this.analyser.disconnect();
  }
}

// Particle class for particle visualization
class Particle {
  private x: number;
  private y: number;
  private vx: number = 0;
  private vy: number = 0;
  private size: number = 2;
  private color: string;
  private life: number = 1;
  private maxLife: number = 1;
  
  constructor(x: number, y: number, colorScheme: ColorScheme) {
    this.x = x;
    this.y = y;
    this.color = colorScheme.primary;
    this.maxLife = Math.random() * 100 + 50;
    this.life = this.maxLife;
  }
  
  update(frequency: number, intensity: number) {
    // Move based on frequency
    this.vx += (Math.random() - 0.5) * frequency * 2;
    this.vy += (Math.random() - 0.5) * frequency * 2;
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Damping
    this.vx *= 0.95;
    this.vy *= 0.95;
    
    // Size based on intensity
    this.size = 2 + intensity * 8;
    
    // Life decay
    this.life -= 1;
    if (this.life <= 0) {
      this.life = this.maxLife;
      this.x = Math.random() * 800;
      this.y = Math.random() * 600;
    }
  }
  
  draw(ctx: CanvasRenderingContext2D) {
    const alpha = this.life / this.maxLife;
    ctx.fillStyle = `rgba(20, 184, 166, ${alpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}
