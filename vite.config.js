import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            manifest: {
                name: 'WorkNest ERP',
                short_name: 'WorkNest',
                theme_color: '#00A8FF',
                background_color: '#FFFFFF',
                display: 'standalone',
                orientation: 'portrait',
                start_url: './',
                scope: './',
                icons: [
                    {
                        src: '../icons/icon-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: '../icons/icon-maskable-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable'
                    },
                    {
                        src: '../icons/icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: '../icons/icon-maskable-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ],
                screenshots: [
                    {
                        src: '../icons/icon-maskable-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        form_factor: 'wide',
                        label: 'WorkNest ERP Dashboard'
                    },
                    {
                        src: '../icons/icon-maskable-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        form_factor: 'narrow',
                        label: 'WorkNest ERP Mobile'
                    }
                ]
            },
            workbox: {
                globDirectory: 'public',
                globPatterns: [
                    'build/assets/*.{js,css}',
                    'icons/*.png',
                    'favicon.ico'
                ],
                navigateFallback: null,
                runtimeCaching: [
                    {
                        urlPattern: ({ request }) => request.destination === 'image' || request.destination === 'font',
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'static-assets-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
                            },
                        },
                    }
                ]
            }
        })
    ],
});
