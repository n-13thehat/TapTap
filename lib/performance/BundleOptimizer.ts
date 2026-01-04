/**
 * Bundle Optimization and Code Splitting Utilities
 * Runtime bundle analysis and optimization recommendations
 */

export interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkInfo[];
  dependencies: DependencyInfo[];
  duplicates: DuplicateInfo[];
  unusedCode: UnusedCodeInfo[];
  recommendations: OptimizationRecommendation[];
}

export interface ChunkInfo {
  name: string;
  size: number;
  gzippedSize: number;
  modules: ModuleInfo[];
  loadTime: number;
  isAsync: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface ModuleInfo {
  name: string;
  size: number;
  imports: string[];
  exports: string[];
  isTreeShakeable: boolean;
  usageCount: number;
}

export interface DependencyInfo {
  name: string;
  version: string;
  size: number;
  isDevDependency: boolean;
  alternatives: AlternativeInfo[];
  usageAnalysis: {
    functionsUsed: string[];
    totalFunctions: number;
    utilizationPercentage: number;
  };
}

export interface AlternativeInfo {
  name: string;
  size: number;
  performance: number;
  popularity: number;
  reason: string;
}

export interface DuplicateInfo {
  module: string;
  instances: number;
  totalSize: number;
  locations: string[];
}

export interface UnusedCodeInfo {
  file: string;
  functions: string[];
  estimatedSize: number;
  confidence: number;
}

export interface OptimizationRecommendation {
  type: 'code-splitting' | 'tree-shaking' | 'dependency-replacement' | 'lazy-loading' | 'compression';
  priority: 'high' | 'medium' | 'low';
  description: string;
  estimatedSavings: number;
  implementation: string;
  effort: 'low' | 'medium' | 'high';
}

export class BundleOptimizer {
  private static instance: BundleOptimizer;
  private moduleRegistry: Map<string, ModuleInfo> = new Map();
  private loadTimes: Map<string, number> = new Map();
  private usageTracking: Map<string, number> = new Map();
  
  private constructor() {
    this.initializeTracking();
  }

  public static getInstance(): BundleOptimizer {
    if (!BundleOptimizer.instance) {
      BundleOptimizer.instance = new BundleOptimizer();
    }
    return BundleOptimizer.instance;
  }

  private initializeTracking() {
    if (typeof window === 'undefined') return;

    // Hook into module loading
    this.trackModuleLoading();
    
    // Track dynamic imports
    this.trackDynamicImports();
    
    // Monitor bundle performance
    this.monitorBundlePerformance();
  }

  private trackModuleLoading() {
    // Hook into webpack's module system if available
    if (typeof (window as any).__webpack_require__ !== 'undefined') {
      const originalRequire = (window as any).__webpack_require__;
      
      (window as any).__webpack_require__ = (moduleId: string) => {
        const startTime = performance.now();
        const result = originalRequire(moduleId);
        const loadTime = performance.now() - startTime;
        
        this.loadTimes.set(moduleId, loadTime);
        this.usageTracking.set(moduleId, (this.usageTracking.get(moduleId) || 0) + 1);
        
        return result;
      };
    }
  }

  private trackDynamicImports() {
    // Hook into dynamic import()
    const originalImport = (window as any).import || (() => {});
    
    (window as any).import = async (specifier: string) => {
      const startTime = performance.now();
      
      try {
        const importedModule = await originalImport(specifier);
        const loadTime = performance.now() - startTime;
        
        this.loadTimes.set(specifier, loadTime);
        
        // Record performance metric
        const { performanceMonitor } = require('./PerformanceMonitor');
        performanceMonitor.recordMetric({
          name: 'dynamic_import',
          value: loadTime,
          unit: 'ms',
          timestamp: Date.now(),
          category: 'network',
          severity: loadTime > 1000 ? 'warning' : 'info',
          metadata: {
            module: specifier,
            loadTime,
          },
        });
        
        return importedModule;
      } catch (error) {
        const loadTime = performance.now() - startTime;
        
        const { performanceMonitor } = require('./PerformanceMonitor');
        performanceMonitor.recordMetric({
          name: 'dynamic_import_failed',
          value: loadTime,
          unit: 'ms',
          timestamp: Date.now(),
          category: 'network',
          severity: 'critical',
          metadata: {
            module: specifier,
            error: (error as Error).message,
          },
        });
        
        throw error;
      }
    };
  }

  private monitorBundlePerformance() {
    // Monitor script loading performance
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource' && entry.name.includes('.js')) {
          const resource = entry as PerformanceResourceTiming;
          
          const { performanceMonitor } = require('./PerformanceMonitor');
          performanceMonitor.recordMetric({
            name: 'script_load_time',
            value: resource.responseEnd - resource.startTime,
            unit: 'ms',
            timestamp: Date.now(),
            category: 'network',
            severity: 'info',
            metadata: {
              url: resource.name,
              size: resource.transferSize,
              cached: resource.transferSize === 0,
            },
          });
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Bundle performance monitoring not supported:', error);
    }
  }

  public async analyzeBundles(): Promise<BundleAnalysis> {
    const chunks = await this.analyzeChunks();
    const dependencies = await this.analyzeDependencies();
    const duplicates = this.findDuplicates();
    const unusedCode = await this.findUnusedCode();
    
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const gzippedSize = chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0);
    
    const recommendations = this.generateRecommendations(chunks, dependencies, duplicates, unusedCode);
    
    return {
      totalSize,
      gzippedSize,
      chunks,
      dependencies,
      duplicates,
      unusedCode,
      recommendations,
    };
  }

  private async analyzeChunks(): Promise<ChunkInfo[]> {
    const chunks: ChunkInfo[] = [];
    
    // Analyze loaded scripts
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    
    for (const script of scripts) {
      const src = (script as HTMLScriptElement).src;
      const loadTime = this.loadTimes.get(src) || 0;
      
      try {
        // Estimate chunk size (in a real implementation, this would come from build tools)
        const response = await fetch(src, { method: 'HEAD' });
        const size = parseInt(response.headers.get('content-length') || '0');
        const gzippedSize = size * 0.7; // Rough estimate
        
        chunks.push({
          name: this.extractChunkName(src),
          size,
          gzippedSize,
          modules: [], // Would be populated from source maps
          loadTime,
          isAsync: script.hasAttribute('async') || script.hasAttribute('defer'),
          priority: this.determinePriority(src),
        });
      } catch (error) {
        console.warn(`Failed to analyze chunk: ${src}`, error);
      }
    }
    
    return chunks;
  }

  private async analyzeDependencies(): Promise<DependencyInfo[]> {
    const dependencies: DependencyInfo[] = [];
    
    // This would typically be done at build time with webpack-bundle-analyzer
    // For runtime analysis, we can only estimate based on loaded modules
    
    const commonDependencies = [
      { name: 'react', estimatedSize: 42000, alternatives: [{ name: 'preact', size: 3000, performance: 0.9, popularity: 0.7, reason: 'Smaller bundle size' }] },
      { name: 'lodash', estimatedSize: 70000, alternatives: [{ name: 'lodash-es', size: 25000, performance: 1.0, popularity: 0.8, reason: 'Tree-shakeable ES modules' }] },
      { name: 'moment', estimatedSize: 67000, alternatives: [{ name: 'date-fns', size: 13000, performance: 1.1, popularity: 0.9, reason: 'Modular and smaller' }] },
    ];
    
    for (const dep of commonDependencies) {
      dependencies.push({
        name: dep.name,
        version: '0.0.0', // Would come from package.json
        size: dep.estimatedSize,
        isDevDependency: false,
        alternatives: dep.alternatives,
        usageAnalysis: {
          functionsUsed: [], // Would be analyzed from source
          totalFunctions: 100, // Estimated
          utilizationPercentage: 30, // Estimated
        },
      });
    }
    
    return dependencies;
  }

  private findDuplicates(): DuplicateInfo[] {
    const duplicates: DuplicateInfo[] = [];
    const moduleCount = new Map<string, { count: number; locations: string[] }>();
    
    // Analyze module usage
    this.usageTracking.forEach((count, moduleId) => {
      if (count > 1) {
        moduleCount.set(moduleId, {
          count,
          locations: [`chunk-${Math.floor(Math.random() * 10)}`], // Simplified
        });
      }
    });
    
    moduleCount.forEach((info, moduleId) => {
      duplicates.push({
        module: moduleId,
        instances: info.count,
        totalSize: info.count * 1000, // Estimated
        locations: info.locations,
      });
    });
    
    return duplicates;
  }

  private async findUnusedCode(): Promise<UnusedCodeInfo[]> {
    const unusedCode: UnusedCodeInfo[] = [];
    
    // This would typically require static analysis tools
    // For runtime detection, we can only estimate based on usage patterns
    
    const lowUsageModules = Array.from(this.usageTracking.entries())
      .filter(([_, count]) => count < 2)
      .map(([moduleId, _]) => ({
        file: moduleId,
        functions: ['unusedFunction1', 'unusedFunction2'], // Would be analyzed
        estimatedSize: 5000, // Estimated
        confidence: 0.7,
      }));
    
    unusedCode.push(...lowUsageModules);
    
    return unusedCode;
  }

  private generateRecommendations(
    chunks: ChunkInfo[],
    dependencies: DependencyInfo[],
    duplicates: DuplicateInfo[],
    unusedCode: UnusedCodeInfo[]
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Large chunks recommendation
    const largeChunks = chunks.filter(chunk => chunk.size > 250000); // > 250KB
    if (largeChunks.length > 0) {
      recommendations.push({
        type: 'code-splitting',
        priority: 'high',
        description: `Split large chunks (${largeChunks.length} chunks > 250KB)`,
        estimatedSavings: largeChunks.reduce((sum, chunk) => sum + chunk.size * 0.3, 0),
        implementation: 'Use dynamic imports and React.lazy for route-based code splitting',
        effort: 'medium',
      });
    }
    
    // Dependency alternatives
    const heavyDependencies = dependencies.filter(dep => dep.size > 50000 && dep.alternatives.length > 0);
    if (heavyDependencies.length > 0) {
      recommendations.push({
        type: 'dependency-replacement',
        priority: 'medium',
        description: `Replace heavy dependencies with lighter alternatives`,
        estimatedSavings: heavyDependencies.reduce((sum, dep) => {
          const bestAlt = dep.alternatives.sort((a, b) => a.size - b.size)[0];
          return sum + (dep.size - bestAlt.size);
        }, 0),
        implementation: 'Replace with suggested alternatives and update imports',
        effort: 'medium',
      });
    }
    
    // Duplicate code
    if (duplicates.length > 0) {
      const totalDuplicateSize = duplicates.reduce((sum, dup) => sum + dup.totalSize, 0);
      recommendations.push({
        type: 'tree-shaking',
        priority: 'high',
        description: `Remove duplicate code (${duplicates.length} duplicates found)`,
        estimatedSavings: totalDuplicateSize * 0.8,
        implementation: 'Configure webpack to properly deduplicate modules',
        effort: 'low',
      });
    }
    
    // Unused code
    if (unusedCode.length > 0) {
      const totalUnusedSize = unusedCode.reduce((sum, unused) => sum + unused.estimatedSize, 0);
      recommendations.push({
        type: 'tree-shaking',
        priority: 'medium',
        description: `Remove unused code (${unusedCode.length} files with unused exports)`,
        estimatedSavings: totalUnusedSize,
        implementation: 'Enable tree-shaking and remove unused exports',
        effort: 'medium',
      });
    }
    
    // Lazy loading opportunities
    const nonCriticalChunks = chunks.filter(chunk => chunk.priority === 'low' && !chunk.isAsync);
    if (nonCriticalChunks.length > 0) {
      recommendations.push({
        type: 'lazy-loading',
        priority: 'medium',
        description: `Implement lazy loading for non-critical features`,
        estimatedSavings: nonCriticalChunks.reduce((sum, chunk) => sum + chunk.size, 0),
        implementation: 'Use React.lazy and Suspense for non-critical components',
        effort: 'medium',
      });
    }
    
    // Compression
    const uncompressedSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const compressedSize = chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0);
    const compressionRatio = compressedSize / uncompressedSize;
    
    if (compressionRatio > 0.8) {
      recommendations.push({
        type: 'compression',
        priority: 'low',
        description: 'Improve compression ratio with better algorithms',
        estimatedSavings: uncompressedSize * 0.2,
        implementation: 'Enable Brotli compression and optimize webpack configuration',
        effort: 'low',
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private extractChunkName(src: string): string {
    const match = src.match(/\/([^\/]+)\.js$/);
    return match ? match[1] : 'unknown';
  }

  private determinePriority(src: string): 'high' | 'medium' | 'low' {
    if (src.includes('main') || src.includes('app')) return 'high';
    if (src.includes('vendor') || src.includes('common')) return 'medium';
    return 'low';
  }

  public getLoadTimeStats(): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    
    this.loadTimes.forEach((time, module) => {
      stats[module] = time;
    });
    
    return stats;
  }

  public getUsageStats(): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    
    this.usageTracking.forEach((count, module) => {
      stats[module] = count;
    });
    
    return stats;
  }

  public clearStats() {
    this.loadTimes.clear();
    this.usageTracking.clear();
  }
}

// Singleton instance
export const bundleOptimizer = BundleOptimizer.getInstance();
