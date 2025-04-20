import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

const pwaIcons = [
  {
    src: '/JME_fit_black_purple.png',
    sizes: '192x192',
    type: 'image/png'
  },
  {
    src: '/JME_fit_black_purple.png',
    sizes: '512x512',
    type: 'image/png'
  }
];

// https://vitejs.dev/config/
// Force Vite to copy all assets from public to dist during build

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Custom plugin to ensure public assets are copied correctly
    {
      name: 'copy-assets',
      enforce: 'post',
      apply: 'build',
      buildStart() {
        console.log('✅ Starting to copy all public assets to the build');
      },
      generateBundle() {
        console.log('✅ Ensuring all public assets are included in the build');
      }
    },
    VitePWA({
      strategies: 'generateSW',
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp,gif,PNG,JPG,JPEG,WEBP,GIF,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets'
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 7
              }
            }
          }
        ]
      },
      manifest: {
        name: 'JmeFit Training',
        short_name: 'JMEFit',
        description: 'Transform your body with expert-guided fitness programs',
        theme_color: '#8B5CF6',
        icons: pwaIcons
      }
    }),
    mode === 'analyze' && visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js']
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/setup.ts']
    }
  },
  build: {
    sourcemap: true,
    assetsInlineLimit: 0, // Don't inline any assets
    copyPublicDir: true, // Ensure public directory is copied to dist
    emptyOutDir: true, // Clean the output directory before build
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@supabase/auth-ui-react', 'lucide-react']
        },
        assetFileNames: (assetInfo) => {
          // Keep original file names for assets in the public directory
          if (assetInfo.name && assetInfo.name.includes('public/')) {
            return 'assets/[name][extname]';
          }
          return 'assets/[hash][extname]';
        },
        chunkFileNames: 'assets/[hash].js',
        entryFileNames: 'assets/[hash].js'
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    cssMinify: true
  }
}));