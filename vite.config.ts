import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: mode === 'production' ? 'auto' : 'script',
      includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png', 'notification-sound.mp3'],
      manifest: {
        name: 'TASQI-AI Assistant',
        short_name: 'TASQI-AI',
        description: 'AI-powered task management assistant',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/dashboard',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: mode !== 'development',
        suppressWarnings: true,
        type: 'module',
        navigateFallback: 'index.html'
      },
      workbox: {
        globPatterns: ['**/favicon.ico', '**/pwa-*.png', '**/index.html'],
        globIgnores: [
          '**/node_modules/**',
          '**/.vite/**', 
          '**/*.map',
          '**/src/**/*.ts',
          '**/src/**/*.tsx',
          '**/src/**'
        ],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => {
              const exactRoutes = ['/', '/dashboard', '/notes', '/settings'];
              return exactRoutes.includes(url.pathname) || 
                     exactRoutes.some(route => url.pathname === route + '/');
            },
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-routes',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60
              }
            }
          },
          {
            urlPattern: ({ url }) => {
              const isSupabaseAPI = url.origin === 'https://mcwlzrikidzgxexnccju.supabase.co';
              const isAuthEndpoint = url.pathname.includes('/auth/');
              
              if (isSupabaseAPI && isAuthEndpoint) {
                return false;
              }
              
              return isSupabaseAPI && url.pathname.includes('/rest/v1/');
            },
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60
              }
            }
          },
          {
            urlPattern: ({ url }) => {
              return url.origin === 'https://mcwlzrikidzgxexnccju.supabase.co' && 
                     url.pathname.includes('/auth/');
            },
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /\.(js|css)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 24 * 60 * 60
              }
            }
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|woff2?)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 7 * 24 * 60 * 60
              }
            }
          }
        ],
        cleanupOutdatedCaches: true,
        clientsClaim: mode === 'production',
        skipWaiting: mode === 'production'
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            '@tanstack/react-query',
            'date-fns',
            'lucide-react'
          ],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip'
          ]
        }
      }
    }
  }
}));
