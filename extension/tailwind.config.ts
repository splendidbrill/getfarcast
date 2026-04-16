import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/popup/**/*.{html,ts,tsx}', './src/styles/**/*.css'],
  theme: {
    extend: {
      colors: {
        farcast: {
          orange: '#ff6b4e',
          ink: '#1a1a2e',
          sand: '#faf8f6'
        }
      },
      boxShadow: {
        card: '0 16px 40px rgba(26, 26, 46, 0.08)'
      }
    }
  },
  plugins: []
};

export default config;
