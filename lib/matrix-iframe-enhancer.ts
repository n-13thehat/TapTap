'use client';

// Global iframe enhancer that applies Matrix effects to all iframes
export class MatrixIframeEnhancer {
  private static instance: MatrixIframeEnhancer;
  private observer: MutationObserver | null = null;
  private enhancedIframes = new WeakSet<HTMLIFrameElement>();
  private matrixCanvases = new WeakMap<HTMLIFrameElement, HTMLCanvasElement>();

  private constructor() {}

  static getInstance(): MatrixIframeEnhancer {
    if (!MatrixIframeEnhancer.instance) {
      MatrixIframeEnhancer.instance = new MatrixIframeEnhancer();
    }
    return MatrixIframeEnhancer.instance;
  }

  // Initialize the enhancer
  initialize() {
    if (typeof window === 'undefined') return;

    // Enhance existing iframes
    this.enhanceExistingIframes();

    // Watch for new iframes
    this.startObserving();

    // Handle page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  // Enhance all existing iframes on the page
  private enhanceExistingIframes() {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => this.enhanceIframe(iframe));
  }

  // Start observing for new iframes
  private startObserving() {
    if (this.observer) return;

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Check if the added node is an iframe
            if (element.tagName === 'IFRAME') {
              this.enhanceIframe(element as HTMLIFrameElement);
            }
            
            // Check for iframes within the added node
            const iframes = element.querySelectorAll('iframe');
            iframes.forEach(iframe => this.enhanceIframe(iframe));
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Enhance a single iframe with Matrix effects
  private enhanceIframe(iframe: HTMLIFrameElement) {
    if (this.enhancedIframes.has(iframe)) return;

    // Mark as enhanced
    this.enhancedIframes.add(iframe);

    // Create Matrix overlay
    this.createMatrixOverlay(iframe);

    // Add Matrix-themed loading state
    this.addLoadingState(iframe);

    // Add hover effects
    this.addHoverEffects(iframe);

    // Try to inject Matrix rain into iframe content (if same-origin)
    iframe.addEventListener('load', () => {
      this.injectMatrixRainIntoIframe(iframe);
    });
  }

  // Create Matrix rain overlay
  private createMatrixOverlay(iframe: HTMLIFrameElement) {
    const container = iframe.parentElement;
    if (!container) return;

    // Ensure container is positioned
    const computedStyle = window.getComputedStyle(container);
    if (computedStyle.position === 'static') {
      container.style.position = 'relative';
    }

    // Create Matrix canvas overlay
    const canvas = document.createElement('canvas');
    canvas.className = 'matrix-iframe-overlay';
    canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
      opacity: 0.2;
      mix-blend-mode: screen;
    `;

    // Insert canvas before iframe
    container.insertBefore(canvas, iframe);
    this.matrixCanvases.set(iframe, canvas);

    // Initialize Matrix rain
    this.initializeMatrixRain(canvas);
  }

  // Add loading state with Matrix theme
  private addLoadingState(iframe: HTMLIFrameElement) {
    const container = iframe.parentElement;
    if (!container) return;

    // Create loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'matrix-iframe-loading';
    loadingOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      transition: opacity 0.5s ease;
    `;

    loadingOverlay.innerHTML = `
      <div style="text-align: center; color: #0fa192; font-family: monospace;">
        <div style="font-size: 16px; margin-bottom: 8px;">ENTERING MATRIX...</div>
        <div style="display: flex; gap: 4px; justify-content: center;">
          <div style="width: 6px; height: 6px; background: #0fa192; border-radius: 50%; animation: pulse 1.5s infinite;"></div>
          <div style="width: 6px; height: 6px; background: #0fa192; border-radius: 50%; animation: pulse 1.5s infinite 0.2s;"></div>
          <div style="width: 6px; height: 6px; background: #0fa192; border-radius: 50%; animation: pulse 1.5s infinite 0.4s;"></div>
        </div>
      </div>
    `;

    // Add CSS animation
    if (!document.querySelector('#matrix-iframe-styles')) {
      const style = document.createElement('style');
      style.id = 'matrix-iframe-styles';
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `;
      document.head.appendChild(style);
    }

    container.insertBefore(loadingOverlay, iframe);

    // Remove loading overlay when iframe loads
    iframe.addEventListener('load', () => {
      setTimeout(() => {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
          if (loadingOverlay.parentNode) {
            loadingOverlay.parentNode.removeChild(loadingOverlay);
          }
        }, 500);
      }, 500);
    });
  }

  // Add hover effects
  private addHoverEffects(iframe: HTMLIFrameElement) {
    const container = iframe.parentElement;
    if (!container) return;

    container.addEventListener('mouseenter', () => {
      const canvas = this.matrixCanvases.get(iframe);
      if (canvas) {
        canvas.style.opacity = '0.4';
        canvas.style.transition = 'opacity 0.3s ease';
      }
    });

    container.addEventListener('mouseleave', () => {
      const canvas = this.matrixCanvases.get(iframe);
      if (canvas) {
        canvas.style.opacity = '0.2';
      }
    });
  }

  // Initialize Matrix rain on canvas using your existing character set
  private initializeMatrixRain(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use your existing brand segments and character set
    const BRAND_SEGMENTS = ["RSL","TAP","369","VX9","IUI","NDA","GMP","AMOK","NHC"];
    const katakana = [
      ..."アカサタナハマヤラワガザダバパ",
      ..."イキシチニヒミリギジヂビピ",
      ..."ウクスツヌフムユルグズヅブプ",
      ..."エケセテネヘメレゲゼデベペ",
      ..."オコソトノホモヨロゴゾドボポ"
    ];
    const handicap = ["♿"];
    const brandChars = [...BRAND_SEGMENTS.join("")];
    const rainChars = [...brandChars, ...katakana, ...handicap];

    const fontSize = 14;
    const teal = '#0fa192';
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;
    let columns = Math.ceil(width / fontSize);
    let drops = new Array(columns).fill(0).map(() => Math.floor(Math.random() * -20));

    const draw = () => {
      // Translucent clear for trail persistence
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      // Draw columns
      for (let i = 0; i < drops.length; i++) {
        const x = i * fontSize + fontSize / 2;
        const y = drops[i] * fontSize;

        // Choose a char: sprinkle ♿ sparsely (1/120 chance)
        const useHandicap = Math.random() < 1/120;
        const ch = useHandicap ? "♿" : rainChars[(Math.random() * rainChars.length) | 0];

        // Glow + fill
        ctx.shadowColor = teal;
        ctx.shadowBlur = 6;
        ctx.fillStyle = teal;
        ctx.fillText(ch, x, y);

        // Advance
        const drift = (1 + Math.random() * 0.2) * 0.8;
        if (y > height && Math.random() > 0.985) {
          drops[i] = 0 - Math.floor(Math.random() * 20);
        } else {
          drops[i] += drift;
        }
      }
    };

    const animate = () => {
      draw();
      requestAnimationFrame(animate);
    };

    // Handle resize
    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      columns = Math.ceil(width / fontSize);
      drops = new Array(columns).fill(0).map(() => Math.floor(Math.random() * -20));
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    animate();
  }

  // Try to inject Matrix rain into iframe content
  private injectMatrixRainIntoIframe(iframe: HTMLIFrameElement) {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      // Check if already injected
      if (iframeDoc.querySelector('#matrix-rain-canvas')) return;

      // Create and inject Matrix rain canvas
      const canvas = iframeDoc.createElement('canvas');
      canvas.id = 'matrix-rain-canvas';
      canvas.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        pointer-events: none !important;
        z-index: 9999 !important;
        opacity: 0.15 !important;
        mix-blend-mode: screen !important;
      `;

      if (iframeDoc.body) {
        iframeDoc.body.appendChild(canvas);
        this.initializeMatrixRain(canvas);
      }
    } catch (error) {
      // Cross-origin restrictions prevent injection
      console.debug('Cannot inject Matrix rain into iframe due to CORS policy');
    }
  }

  // Handle page visibility changes
  private handleVisibilityChange() {
    // Pause/resume Matrix animations based on page visibility
    const canvases = document.querySelectorAll('.matrix-iframe-overlay');
    canvases.forEach(canvas => {
      if (document.hidden) {
        (canvas as HTMLCanvasElement).style.animationPlayState = 'paused';
      } else {
        (canvas as HTMLCanvasElement).style.animationPlayState = 'running';
      }
    });
  }

  // Cleanup
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Clean up enhanced iframes
    this.enhancedIframes = new WeakSet();
    this.matrixCanvases = new WeakMap();
  }
}

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      MatrixIframeEnhancer.getInstance().initialize();
    });
  } else {
    MatrixIframeEnhancer.getInstance().initialize();
  }
}
