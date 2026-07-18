import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Poppins', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                primary: {
                    DEFAULT: '#1e88e5',
                    dark: '#1565c0',
                    soft: 'rgba(30, 136, 229, 0.12)',
                },
                accent: {
                    DEFAULT: '#26c6da',
                    dark: '#01c0c8',
                },
                mp: {
                    bg: '#eef5f9',
                    heading: '#455a64',
                    body: '#67757c',
                    muted: '#a1aab2',
                    sidebar: '#607d8b',
                    'sidebar-icon': '#99abb4',
                    purple: '#7460ee',
                    cyan: '#26c6da',
                    danger: '#fc4b6c',
                    warning: '#ffb22b',
                },
            },
            boxShadow: {
                mp: '0 5px 20px rgba(0, 0, 0, 0.05)',
                'mp-card': '0 1px 4px rgba(0, 0, 0, 0.08)',
            },
            borderRadius: {
                mp: '18px',
                'mp-sm': '12px',
            },
        },
    },

    plugins: [forms],
};
