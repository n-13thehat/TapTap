/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
      "./providers/**/*.{js,ts,jsx,tsx,mdx}",
      "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
      "./lib/**/*.{js,ts,jsx,tsx,mdx}",
      "./stores/**/*.{js,ts,jsx,tsx,mdx}",
      "./visuals/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    safelist: [
        {
            pattern: /^(border|bg|text)-(emerald|teal|green|blue|purple|red|yellow|indigo)-(100|200|300|400|500)(\/(5|10|20|30|40|50))?$/,
        },
    ],
  theme: {
  	extend: {
  		colors: {
  			// Matrix Theme Colors
  			matrix: {
  				primary: '#00ffd2',
  				teal: '#14b8a6',
  				cyan: '#00F0FF',
  				green: '#00ff41',
  				dark: '#001a17',
  				darker: '#000a08',
  				text: '#e6fffa',
  				'text-dim': 'rgba(230,255,250,0.7)',
  				'bg-glass': 'rgba(0,0,0,0.8)',
  				glow: 'rgba(0,255,210,0.6)',
  				'glow-soft': 'rgba(0,255,210,0.2)',
  				border: 'rgba(20,184,166,0.3)',
  			},

  			// Agent Theme Colors
  			hope: {
  				DEFAULT: '#3b82f6',
  				light: '#60a5fa',
  				dark: '#2563eb',
  			},
  			muse: {
  				DEFAULT: '#8b5cf6',
  				light: '#a78bfa',
  				dark: '#7c3aed',
  			},
  			treasure: {
  				DEFAULT: '#22c55e',
  				light: '#4ade80',
  				dark: '#16a34a',
  			},

  			// Semantic Colors
  			success: '#22c55e',
  			warning: '#f59e0b',
  			error: '#ef4444',
  			info: '#3b82f6',

  			// shadcn/ui compatibility
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},

  		// Spacing Scale
  		spacing: {
  			'xs': '0.25rem',
  			'sm': '0.5rem',
  			'md': '1rem',
  			'lg': '1.5rem',
  			'xl': '2rem',
  			'2xl': '3rem',
  			'3xl': '4rem',
  			'4xl': '6rem',
  			'5xl': '8rem',
  		},

  		// Box Shadows with Glows
  		boxShadow: {
  			glow: '0 0 30px rgba(0, 240, 255, 0.35)',
  			'glow-teal': '0 0 20px rgba(20, 184, 166, 0.5)',
  			'glow-cyan': '0 0 20px rgba(0, 240, 255, 0.5)',
  			'glow-hope': '0 0 20px rgba(59, 130, 246, 0.5)',
  			'glow-muse': '0 0 20px rgba(139, 92, 246, 0.5)',
  			'glow-treasure': '0 0 20px rgba(34, 197, 94, 0.5)',
  		},

  		// Animations
  		keyframes: {
  			rain: {
  				'0%': { backgroundPosition: '0 0' },
  				'100%': { backgroundPosition: '0 1000px' }
  			},
  			'fade-in': {
  				'0%': { opacity: '0' },
  				'100%': { opacity: '1' }
  			},
  			'slide-up': {
  				'0%': { transform: 'translateY(10px)', opacity: '0' },
  				'100%': { transform: 'translateY(0)', opacity: '1' }
  			},
  			'slide-down': {
  				'0%': { transform: 'translateY(-10px)', opacity: '0' },
  				'100%': { transform: 'translateY(0)', opacity: '1' }
  			},
  			'scale-in': {
  				'0%': { transform: 'scale(0.95)', opacity: '0' },
  				'100%': { transform: 'scale(1)', opacity: '1' }
  			},
  			shimmer: {
  				'0%': { backgroundPosition: '-200% 0' },
  				'100%': { backgroundPosition: '200% 0' },
  			},
  			'matrix-pulse': {
  				'0%, 100%': { opacity: '0.6' },
  				'50%': { opacity: '1' },
  			},
  		},
  		animation: {
  			rain: 'rain 20s linear infinite',
  			'fade-in': 'fade-in 0.3s ease-out',
  			'slide-up': 'slide-up 0.3s ease-out',
  			'slide-down': 'slide-down 0.3s ease-out',
  			'scale-in': 'scale-in 0.2s ease-out',
  			shimmer: 'shimmer 1.6s ease-in-out infinite',
  			'matrix-pulse': 'matrix-pulse 1.5s ease-in-out infinite',
  		},

  		// Border Radius
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},

  		// Z-Index Scale
  		zIndex: {
  			'dropdown': '1000',
  			'sticky': '1100',
  			'fixed': '1200',
  			'modal-backdrop': '1300',
  			'modal': '1400',
  			'popover': '1500',
  			'tooltip': '1600',
  			'toast': '1700',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")]
};
