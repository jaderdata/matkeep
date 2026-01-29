/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#4f46e5',
                    light: '#6366f1',
                    dark: '#3730a3',
                },
                accent: '#f59e0b',
                surface: '#0f172a',
            },
        },
    },
    plugins: [],
}
