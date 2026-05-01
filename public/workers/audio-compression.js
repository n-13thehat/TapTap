/**
 * Audio Compression Worker
 * High-performance audio compression using Web Workers
 */

// Import compression algorithms (simplified implementations)
class AudioCompressor {
  constructor() {
    this.compressionAlgorithms = {
      'lossless': this.losslessCompress.bind(this),
      'lossy': this.lossyCompress.bind(this),
      'adaptive': this.adaptiveCompress.bind(this),
    };
  }

  // Lossless compression using run-length encoding
  losslessCompress(buffer, quality = 1.0) {
    const compressed = [];
    const threshold = 0.001; // Silence threshold
    
    for (let channel = 0; channel < buffer.length; channel++) {
      const channelData = buffer[channel];
      const compressedChannel = [];
      
      let i = 0;
      while (i < channelData.length) {
        const value = channelData[i];
        
        // Check for silence runs
        if (Math.abs(value) < threshold) {
          let runLength = 1;
          while (i + runLength < channelData.length && 
                 Math.abs(channelData[i + runLength]) < threshold) {
            runLength++;
          }
          
          // Encode silence run
          compressedChannel.push({ type: 'silence', length: runLength });
          i += runLength;
        } else {
          // Store non-silent samples
          compressedChannel.push({ type: 'sample', value: value });
          i++;
        }
      }
      
      compressed.push(compressedChannel);
    }
    
    return {
      compressed,
      compressionRatio: this.calculateCompressionRatio(buffer, compressed),
      algorithm: 'lossless'
    };
  }

  // Lossy compression using quantization
  lossyCompress(buffer, quality = 0.8) {
    const compressed = [];
    const quantizationLevels = Math.floor(quality * 65536); // 16-bit to lower bit depth
    
    for (let channel = 0; channel < buffer.length; channel++) {
      const channelData = buffer[channel];
      const compressedChannel = new Float32Array(channelData.length);
      
      for (let i = 0; i < channelData.length; i++) {
        // Quantize the sample
        const quantized = Math.round(channelData[i] * quantizationLevels) / quantizationLevels;
        compressedChannel[i] = quantized;
      }
      
      compressed.push(compressedChannel);
    }
    
    return {
      compressed,
      compressionRatio: this.calculateCompressionRatio(buffer, compressed),
      algorithm: 'lossy'
    };
  }

  // Adaptive compression based on content analysis
  adaptiveCompress(buffer, quality = 0.8) {
    const compressed = [];
    
    for (let channel = 0; channel < buffer.length; channel++) {
      const channelData = buffer[channel];
      const compressedChannel = [];
      
      // Analyze audio content
      const analysis = this.analyzeAudioContent(channelData);
      
      // Choose compression strategy based on content
      if (analysis.isSilent) {
        // Use silence compression
        compressedChannel.push({ type: 'silence', length: channelData.length });
      } else if (analysis.isNoisy) {
        // Use aggressive lossy compression for noise
        const quantizationLevels = Math.floor(quality * 0.5 * 65536);
        for (let i = 0; i < channelData.length; i++) {
          const quantized = Math.round(channelData[i] * quantizationLevels) / quantizationLevels;
          compressedChannel.push({ type: 'sample', value: quantized });
        }
      } else {
        // Use high-quality compression for music/speech
        const quantizationLevels = Math.floor(quality * 65536);
        for (let i = 0; i < channelData.length; i++) {
          const quantized = Math.round(channelData[i] * quantizationLevels) / quantizationLevels;
          compressedChannel.push({ type: 'sample', value: quantized });
        }
      }
      
      compressed.push(compressedChannel);
    }
    
    return {
      compressed,
      compressionRatio: this.calculateCompressionRatio(buffer, compressed),
      algorithm: 'adaptive'
    };
  }

  // Analyze audio content characteristics
  analyzeAudioContent(channelData) {
    let silentSamples = 0;
    let noisySamples = 0;
    let totalEnergy = 0;
    
    const silenceThreshold = 0.001;
    const noiseThreshold = 0.1;
    
    for (let i = 0; i < channelData.length; i++) {
      const sample = Math.abs(channelData[i]);
      totalEnergy += sample * sample;
      
      if (sample < silenceThreshold) {
        silentSamples++;
      } else if (sample > noiseThreshold) {
        noisySamples++;
      }
    }
    
    const averageEnergy = totalEnergy / channelData.length;
    const silenceRatio = silentSamples / channelData.length;
    const noiseRatio = noisySamples / channelData.length;
    
    return {
      isSilent: silenceRatio > 0.8,
      isNoisy: noiseRatio > 0.3 && averageEnergy > 0.01,
      averageEnergy,
      silenceRatio,
      noiseRatio
    };
  }

  // Calculate compression ratio
  calculateCompressionRatio(original, compressed) {
    const originalSize = original.reduce((sum, channel) => sum + channel.length * 4, 0); // 4 bytes per float
    
    let compressedSize = 0;
    for (const channel of compressed) {
      if (Array.isArray(channel)) {
        // Compressed format
        compressedSize += channel.length * 8; // Estimate 8 bytes per compressed element
      } else {
        // Float32Array format
        compressedSize += channel.length * 4;
      }
    }
    
    return compressedSize / originalSize;
  }

  // Decompress audio data
  decompress(compressedData) {
    const { compressed, algorithm } = compressedData;
    const decompressed = [];
    
    for (const channel of compressed) {
      if (Array.isArray(channel)) {
        // Decompress structured format
        const decompressedChannel = [];
        
        for (const element of channel) {
          if (element.type === 'silence') {
            // Expand silence
            for (let i = 0; i < element.length; i++) {
              decompressedChannel.push(0);
            }
          } else if (element.type === 'sample') {
            decompressedChannel.push(element.value);
          }
        }
        
        decompressed.push(new Float32Array(decompressedChannel));
      } else {
        // Already in Float32Array format
        decompressed.push(channel);
      }
    }
    
    return decompressed;
  }
}

// Initialize compressor
const compressor = new AudioCompressor();

// Handle messages from main thread
self.onmessage = function(event) {
  const { id, command, buffer, quality, compressedData } = event.data;
  
  try {
    switch (command) {
      case 'compress':
        const result = compressor.adaptiveCompress(buffer, quality);
        self.postMessage({
          id,
          compressedData: result.compressed,
          compressionRatio: result.compressionRatio,
          algorithm: result.algorithm
        });
        break;
        
      case 'decompress':
        const decompressed = compressor.decompress(compressedData);
        self.postMessage({
          id,
          buffer: decompressed
        });
        break;
        
      case 'analyze':
        const analysis = compressor.analyzeAudioContent(buffer[0]); // Analyze first channel
        self.postMessage({
          id,
          analysis
        });
        break;
        
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    self.postMessage({
      id,
      error: error.message
    });
  }
};
