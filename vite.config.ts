
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
      injectRegister: 'auto',
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
        enabled: true,
        /* Reduce development logging */
        suppressWarnings: true,
        type: 'module',
        navigateFallback: 'index.html'
      },
      workbox: {
        // Reduce what files are processed in dev mode
        globPatterns: mode === 'production' 
          ? ['**/*.{js,css,html,ico,png,svg,webp}'] 
          : ['**/pwa-*.png', '**/*-legacy*.js', '**/*.css', 'favicon.ico', 'index.html'],
        
        // Exclude development files and source maps
        globIgnores: [
          '**/node_modules/**',
          '**/.vite/**', 
          '**/*.map',
          '**/src/**/*.ts',
          '**/src/**/*.tsx'
        ],
        
        // Optimize caching strategies
        runtimeCaching: [
          {
            urlPattern: ({ url }) => {
              // Only app routes - be more selective
              const appRoutes = ['/', '/dashboard', '/notes', '/settings'];
              return appRoutes.some(route => url.pathname === route || url.pathname === route + '/');
            },
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-routes',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // API calls - EXCLUDE auth endpoints
            urlPattern: ({ url }) => {
              const isSupabaseAPI = url.origin === 'https://mcwlzrikidzgxexnccju.supabase.co';
              const isAuthEndpoint = url.pathname.includes('/auth/');
              return isSupabaseAPI && !isAuthEndpoint;
            },
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Auth endpoints - use NetworkOnly
            urlPattern: ({ url }) => {
              const isSupabaseAPI = url.origin === 'https://mcwlzrikidzgxexnccju.supabase.co';
              const isAuthEndpoint = url.pathname.includes('/auth/');
              return isSupabaseAPI && isAuthEndpoint;
            },
            handler: 'NetworkOnly',
            options: {
              // No caching options needed for NetworkOnly
            }
          },
          {
            // Static assets - use CacheFirst for better performance
            urlPattern: /\.(css|js|ico|png|svg|webp|woff2?)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
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
