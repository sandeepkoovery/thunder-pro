import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

if ('serviceWorker' in navigator) {
    registerSW({ immediate: true });
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        if (typeof window !== 'undefined') {
            const isPwa = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone === true ||
                          window.location.search.includes('source=pwa') ||
                          window.location.search.includes('pwa=1');
            if (isPwa) {
                router.on('before', (event) => {
                    if (event.detail && event.detail.visit) {
                        event.detail.visit.headers = event.detail.visit.headers || {};
                        event.detail.visit.headers['X-PWA-Mode'] = 'true';
                    }
                });
            }
        }

        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
