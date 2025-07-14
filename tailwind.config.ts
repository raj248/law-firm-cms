import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./electron/**/*.{ts,js}", // ADD THIS
  ],
  theme: { extend: {} },
  plugins: [require('@tailwindcss/line-clamp')],
}

export default config
