import axios from 'axios';
import { router } from '@inertiajs/react';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

if (typeof window !== 'undefined') {
    const isPwa = window.matchMedia('(display-mode: standalone)').matches ||
                  window.navigator.standalone === true ||
                  window.location.search.includes('source=pwa') ||
                  window.location.search.includes('pwa=1');

    if (isPwa) {
        window.axios.defaults.headers.common['X-PWA-Mode'] = 'true';
        router.on('before', (event) => {
            event.detail.visit.headers = event.detail.visit.headers || {};
            event.detail.visit.headers['X-PWA-Mode'] = 'true';
        });
    }
}
