import { fileURLToPath } from "url";
import path from "path";

if (!process.env.SILENCE_BIGINT_NATIVE_WARNING) {
  process.env.SILENCE_BIGINT_NATIVE_WARNING = "1";
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const INSTRUMENTATION_EXTERNALS = [
  "@opentelemetry/api",
  "@opentelemetry/instrumentation",
  "@prisma/instrumentation",
  "require-in-the-middle",
];

const INSTRUMENTATION_WARNING_SNIPPETS = ["@opentelemetry/instrumentation", "require-in-the-middle"];

const toArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const makeExternal = (moduleName) => ({ [moduleName]: `commonjs ${moduleName}` });

const makeWarningFilter = (needle) => (warning) => {
  if (typeof warning?.message !== "string") return false;
  return warning.message.includes("Critical dependency") && warning.message.includes(needle);
};

/** @type {import("next").NextConfig} */
const nextConfig = {
  // Force file-tracing to this project root to silence multi-lockfile warning
  outputFileTracingRoot: __dirname,

  // Output configuration
  output: "standalone",

  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Development optimizations
  devIndicators: {
    buildActivity: false,
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      'framer-motion',
      '@headlessui/react'
    ],
  },

  // Turbopack configuration for Next.js 16
  turbopack: {
    root: __dirname,
    rules: {
      '*.pdf': {
        loaders: ['file-loader'],
        as: '*.pdf',
      },
    },
    resolveAlias: {
      '@': path.resolve(__dirname),
    },
  },

  // Disable TypeScript checking during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },

  // Environment variable validation
  env: {
    CUSTOM_KEY: process.env.NODE_ENV,
    SILENCE_BIGINT_NATIVE_WARNING: "1",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdns-images.dzcdn.net" },
      { protocol: "https", hostname: "cdn-images.dzcdn.net" },
    ],
  },
  webpack(config, { isServer, dev }) {
    // Performance optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
          },
        },
      };
    }

    // PDF rule
    const pdfRule = {
      test: /\.pdf$/i,
      type: "asset/resource",
      generator: {
        filename: "static/media/[name].[contenthash][ext]"
      }
    };

    if (!config.module) {
      config.module = { rules: [], ...config.module };
    }
    config.module.rules.push(pdfRule);

    // Optimize bundle size
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };

    if (isServer) {
      const existingExternals = toArray(config.externals);
      const knownExternalIds = new Set(
        existingExternals
          .map((external) => {
            if (typeof external !== "object" || !external) return undefined;
            const [name] = Object.keys(external);
            return name;
          })
          .filter(Boolean),
      );
      const instrumentationEntries = INSTRUMENTATION_EXTERNALS.filter((moduleName) => !knownExternalIds.has(moduleName)).map(
        makeExternal,
      );
      config.externals = [...existingExternals, ...instrumentationEntries];
      const warningFilters = INSTRUMENTATION_WARNING_SNIPPETS.map(makeWarningFilter);
      config.ignoreWarnings = [...(config.ignoreWarnings || []), ...warningFilters];
    }
    return config;
  },
};

export default nextConfig;
