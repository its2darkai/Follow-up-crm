import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Hardcoded API Key as requested
    'process.env.API_KEY': JSON.stringify("AIzaSyBL7noGh8Vc0KL2HcFQp54m0fxlMKMUSm4")
  },
  build: {
    outDir: 'dist',
  }
});