<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts: Poppins & Plus Jakarta Sans -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <!-- PWA Meta Tags -->
        <meta name="theme-color" content="#ffffff">
        <link rel="manifest" href="{{ url('/manifest.webmanifest?v=12') }}">
        <link rel="apple-touch-icon" href="{{ asset('icons/icon-192x192.png?v=12') }}">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="WorkNest">

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
        <style>
            @keyframes wnSpinner {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    </head>
    <body class="font-sans antialiased bg-white">
        <div id="app" data-page="{{ json_encode($page) }}">
            <div id="wn-app-loader" style="position: fixed; inset: 0; z-index: 99999; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #ffffff; font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;">
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; text-align: center;">
                    <div style="position: relative; width: 96px; height: 96px; display: flex; align-items: center; justify-content: center; background: #ffffff; border-radius: 24px; box-shadow: 0 12px 30px -8px rgba(116, 96, 238, 0.2), 0 4px 12px -2px rgba(0, 0, 0, 0.05); border: 1px solid #f1f5f9;">
                        <img src="{{ asset('images/worknest_logo.png') }}" alt="WorkNest" style="width: 64px; height: auto; object-fit: contain;">
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px; background: #f8fafc; padding: 10px 22px; border-radius: 9999px; border: 1px solid #e2e8f0; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
                        <div style="width: 20px; height: 20px; border: 2.5px solid #e2e8f0; border-top-color: #7460ee; border-radius: 50%; animation: wnSpinner 0.75s linear infinite;"></div>
                        <span style="font-size: 13.5px; font-weight: 600; color: #475569; letter-spacing: 0.01em;">Loading WorkNest...</span>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>
